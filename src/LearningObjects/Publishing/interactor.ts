import { LearningObject } from '../../shared/entity';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { isAdminOrEditor } from '../../shared/AuthorizationManager';
import { UserToken } from '../../shared/types';
import { ReleaseEmailGateway } from './release-email-gateway';

export interface PublishingDataStore {
    addToReleased(releasableObject: LearningObject): Promise<void>;
}

/**
 * If the user is an admin or editor (the only roles that can release a Learning Object),
 * then request the data store marks the Learning Object as released. Otherwise, throw a
 * ResourceError.
 */
export async function releaseLearningObject({ userToken, dataStore, releasableObject, releaseEmailGateway }: {
    userToken: UserToken,
    dataStore: PublishingDataStore;
    releasableObject: LearningObject;
    releaseEmailGateway: ReleaseEmailGateway,
}): Promise<void> {
    if (isAdminOrEditor(userToken.accessGroups)) {
        releaseEmailGateway.invokeReleaseNotification({
            learningObjectName: releasableObject.name,
            authorName: releasableObject.author.name,
            collection: releasableObject.collection,
            authorEmail: releasableObject.author.email,
            username: releasableObject.author.username,
        });
        return dataStore.addToReleased(releasableObject);
    }
    throw new ResourceError(`${userToken.username} does not have access to release this Learning Object`, ResourceErrorReason.INVALID_ACCESS);
}
