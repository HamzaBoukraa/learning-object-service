import { LearningObject } from '../../shared/entity';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { UserToken } from '../../shared/types';
import { ReleaseEmailGateway } from './ReleaseEmails/release-email-gateway';
import { HierarchyAdapter } from '../Hierarchy/HierarchyAdapter';
import { bundleLearningObject } from './Bundler/Interactor';
import { requesterIsAdminOrEditor } from '../../shared/AuthorizationManager';
import { reportError } from '../../shared/SentryConnector';
import { ModuleFileManagerGateway } from './ModuleFileManagerGateway';

namespace Gateways {
    export const fileManager = () => new ModuleFileManagerGateway();
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
export async function releaseLearningObject({ userToken, dataStore, releasableObject, releaseEmailGateway }: {
    userToken: UserToken,
    dataStore: PublishingDataStore;
    releasableObject: LearningObject;
    releaseEmailGateway: ReleaseEmailGateway,
}): Promise<void> {
    if (!requesterIsAdminOrEditor(userToken)) {
        throw new ResourceError(`${userToken.username} does not have access to release this Learning Object`, ResourceErrorReason.INVALID_ACCESS);
    }
    try {
        await createPublishingArtifacts(releasableObject, userToken);
    } catch (e) {
        reportError(e);
    }
    await dataStore.addToReleased(releasableObject);
    await sendEmail(releasableObject, userToken, releaseEmailGateway);
}

/**
 * createPublishingArtifacts handles the creation and storage of content created as a result
 * of releasing a Learning Object. This includes a bundle of all files associated with the
 * Learning Object for faster download.
 *
 * @param releasableObject the Learning Object to create artifacts for
 * @param userToken the user who has requested to publish a Learning Object
 */
async function createPublishingArtifacts(releasableObject: LearningObject, userToken: UserToken) {
    const bundle = await bundleLearningObject({
        learningObject: releasableObject,
        requesterUsername: userToken.username,
    });
    await Gateways.fileManager().uploadFile({
        authorUsername: releasableObject.author.username,
        learningObjectId: releasableObject.id,
        file: {
            path: 'bundle.zip',
            data: bundle,
        },
    });
}

/**
 * sendEmail determines if the Learning Object author should recieve an email about the release,
 * and triggers the send email action if it does. Authors should only be notified if the Learning
 * Object being released has no parent.
 * @param releasableObject the Learning Object being released
 * @param userToken the user who triggered the release
 * @param releaseEmailGateway the Gateway that makes the API calls to send release emails
 */
async function sendEmail(releasableObject: LearningObject, userToken: UserToken, releaseEmailGateway: ReleaseEmailGateway) {
    const isTopLevelObject = await HierarchyAdapter.getInstance().isTopLevelLearningObject({
        learningObjectID: releasableObject.id,
        userToken,
    });
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
