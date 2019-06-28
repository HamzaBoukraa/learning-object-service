import { LearningObject } from '../../shared/entity';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { UserToken } from '../../shared/types';
import { ReleaseEmailGateway } from './ReleaseEmails/release-email-gateway';
import { HierarchyAdapter } from '../Hierarchy/HierarchyAdapter';
import { requesterIsAdminOrEditor } from '../../shared/AuthorizationManager';

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
    if (!requesterIsAdminOrEditor(userToken)) {
        throw new ResourceError(`${userToken.username} does not have access to release this Learning Object`, ResourceErrorReason.INVALID_ACCESS);
    }
    await dataStore.addToReleased(releasableObject);
    await sendEmail(releasableObject, userToken, releaseEmailGateway);
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
