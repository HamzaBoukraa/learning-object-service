import { LearningObject } from '../../shared/entity';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { isAdminOrEditor } from '../../shared/AuthorizationManager';
import { UserToken } from '../../shared/types';
import { ReleaseEmailGateway } from './ReleaseEmails/release-email-gateway';
import { HierarchyAdapter } from '../Hierarchy/HierarchyAdapter';
import { bundleLearningObject } from './Bundler/Interactor';
import { FileManagerAdapter } from '../../FileManager/FileManagerAdapter';

export interface PublishingDataStore {
    addToReleased(releasableObject: LearningObject): Promise<void>;
}

/**
 * If the user is an admin or editor (the only roles that can release a Learning Object),
 * then request the data store marks the Learning Object as released. Otherwise, throw a
 * ResourceError. An email will only be sent to the Learning Object author if the
 * Learning Object being released is a top-level (parent) objct
 */
export async function releaseLearningObject({ userToken, dataStore, releasableObject, releaseEmailGateway }: {
    userToken: UserToken,
    dataStore: PublishingDataStore;
    releasableObject: LearningObject;
    releaseEmailGateway: ReleaseEmailGateway,
}): Promise<void> {
    if (!isAdminOrEditor(userToken.accessGroups)) {
        throw new ResourceError(`${userToken.username} does not have access to release this Learning Object`, ResourceErrorReason.INVALID_ACCESS);
    }
    await createPublishingArtifacts(releasableObject, userToken);
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
    const storagePrefix = `${releasableObject.author.username}/${releasableObject.id}`;
    const bundle = await bundleLearningObject({
        learningObject: releasableObject,
        writeStream: null,
        requesterUsername: userToken.username,
    });
    await FileManagerAdapter.getInstance().uploadFile({
        file: {
            // TODO: Should this be moved to the File Manager?
            path: `${storagePrefix}/bundle.zip`,
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
