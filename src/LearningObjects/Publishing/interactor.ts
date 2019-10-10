import { LearningObject, HierarchicalLearningObject } from '../../shared/entity';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { UserToken } from '../../shared/types';
import { ReleaseEmailGateway } from './ReleaseEmails/release-email-gateway';
import { HierarchyAdapter } from '../Hierarchy/HierarchyAdapter';
import { bundleLearningObject } from './Bundler/Interactor';
import { requesterIsAdminOrEditor } from '../../shared/AuthorizationManager';
import { reportError } from '../../shared/SentryConnector';
import { LearningObjectsModule } from '../LearningObjectsModule';
import { FileManagerGateway } from './FileManagerGateway';
import { FileManagerGateway as FileManagerInjectionKey } from '../interfaces/FileManagerGateway';
import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';

// FIXME: The Publishing Module was setup as a sub-module of LearningObjectsModule,
// should it be able to resolve dependencies from the parent LearningObjectsModule or should it declare its own dependencies?
namespace Gateways {
  export const fileManager = () =>
    LearningObjectsModule.resolveDependency(
      FileManagerInjectionKey,
    ) as FileManagerGateway;
}

export interface PublishingDataStore {
  addToReleased(releasableObject: LearningObject): Promise<void>;
}

/**
 * If the user is an admin or editor (the only roles that can release a Learning Object),
 * then:
 * 1. Generate the relevant artifacts for the release
 * 2. Add the Learning Object to the released set
 * 3. Send out a notification to the author
 *
 * Notes:
 * If the generation of publishing artifacts fails, report the error but do not abort the release - as this
 * should be handled retrospectively.
 * An email will only be sent to the Learning Object author if the
 * Learning Object being released is a top-level (parent) object.
 */
export async function releaseLearningObject({
  authorUsername,
  userToken,
  dataStore,
  releasableObject,
  releaseEmailGateway,
  learningObjectSubmissionGateway,
}: {
  authorUsername: string;
  userToken: UserToken;
  dataStore: PublishingDataStore;
  releasableObject: HierarchicalLearningObject;
  releaseEmailGateway: ReleaseEmailGateway;
  learningObjectSubmissionGateway: LearningObjectSubmissionGateway;
}): Promise<void> {
    if (!requesterIsAdminOrEditor(userToken)) {
        throw new ResourceError(`${userToken.username} does not have access to release this Learning Object`, ResourceErrorReason.INVALID_ACCESS);
    }
    await createPublishingArtifacts(releasableObject).catch(reportError);
    await dataStore.addToReleased(releasableObject);
    await learningObjectSubmissionGateway.deleteSubmission({
      learningObjectId: releasableObject.id,
      authorUsername,
      user: userToken,
    });
    await sendEmail(releasableObject, userToken, releaseEmailGateway);
}

/**
 * createPublishingArtifacts handles the creation and storage of content created as a result
 * of releasing a Learning Object. This includes:
 * 1. A JSON file with the fully denormalized Learning Object metadata
 * 2. A bundle of all files associated with the Learning Object for faster download
 *
 * @param releasableObject the Learning Object to create artifacts for
 */
async function createPublishingArtifacts(
  releasableObject: HierarchicalLearningObject,
) {
  Gateways.fileManager().uploadFile({
    authorUsername: releasableObject.author.username,
    learningObjectId: releasableObject.id,
    version: releasableObject.version,
    file: {
      path: 'meta.json',
      data: JSON.stringify(releasableObject.toPlainObject()),
    },
  });
  const bundle = await bundleLearningObject({
    learningObject: releasableObject,
  });
  await Gateways.fileManager().uploadFile({
    authorUsername: releasableObject.author.username,
    learningObjectId: releasableObject.id,
    version: releasableObject.version,
    file: {
      path: `${releasableObject.cuid}.zip`,
      data: bundle,
    },
  });
}

/**
 * sendEmail determines if the Learning Object author should receive an email about the release,
 * and triggers the send email action if it does. Authors should only be notified if the Learning
 * Object being released has no parent.
 * @param releasableObject the Learning Object being released
 * @param userToken the user who triggered the release
 * @param releaseEmailGateway the Gateway that makes the API calls to send release emails
 */
async function sendEmail(
  releasableObject: LearningObject,
  userToken: UserToken,
  releaseEmailGateway: ReleaseEmailGateway,
) {
  const isTopLevelObject = await HierarchyAdapter.getInstance().isTopLevelLearningObject(
    {
      learningObjectID: releasableObject.id,
      userToken,
    },
  );
  if (isTopLevelObject) {
    releaseEmailGateway.invokeReleaseNotification({
      learningObjectName: releasableObject.name,
      authorName: releasableObject.author.name,
      collection: releasableObject.collection,
      authorEmail: releasableObject.author.email,
      username: releasableObject.author.username,
    });
  }
}
