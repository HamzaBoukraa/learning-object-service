import { DataStore } from '../../shared/interfaces/DataStore';
import { LearningObject } from '../../shared/entity';
import { ElasticMongoReleaseRequestDuplicator } from './ElasticMongoReleaseRequestDuplicator';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { isAdminOrEditor } from '../../shared/AuthorizationManager';
import { UserToken } from '../../shared/types';
import { generateServiceToken } from '../../drivers/TokenManager';

export interface PublishingDataStore {
    addToReleased(releasableObject: LearningObject): Promise<void>;
}

/**
 * If the user is an admin or editor (the only roles that can release a Learning Object),
 * then request the data store marks the Learning Object as released. Otherwise, throw a
 * ResourceError.
 */
export async function releaseLearningObject({ userToken, dataStore, releasableObject }: {
    userToken: UserToken,
    dataStore: PublishingDataStore;
    releasableObject: LearningObject;
}): Promise<void> {
    if (isAdminOrEditor(userToken.accessGroups)) {
        fetch(process.env.RELEASE_EMAIL_INVOCATION, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${generateServiceToken()}`,
            },
            body: JSON.stringify({
                learningObjectName: releasableObject.name,
                authorName: releasableObject.author.name,
                collection: releasableObject.collection,
                authorEmail: releasableObject.author.email,
                username: releasableObject.author.username,
            }),
        });
        return dataStore.addToReleased(releasableObject);
    }
    throw new ResourceError(`${userToken.username} does not have access to release this Learning Object`, ResourceErrorReason.INVALID_ACCESS);
}
