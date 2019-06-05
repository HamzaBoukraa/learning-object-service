import { DataStore } from '../../shared/interfaces/DataStore';
import { LearningObject } from '../../shared/entity';
import { ElasticMongoReleaseRequestDuplicator } from './ElasticMongoReleaseRequestDuplicator';
import { ResourceError, ResourceErrorReason, ServiceError, ServiceErrorReason } from '../../shared/errors';
import { isAdminOrEditor } from '../../shared/AuthorizationManager';
import { UserToken } from '../../shared/types';
import { generateServiceToken } from '../../drivers/TokenManager';
import * as https from 'https';

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
        const postData = JSON.stringify({
            learningObjectName: releasableObject.name,
            authorName: releasableObject.author.name,
            collection: releasableObject.collection,
            authorEmail: releasableObject.author.email,
            username: releasableObject.author.username,
        });

        const options = {
          hostname: process.env.RELEASE_EMAIL_INVOCATION.split('/')[0],
          method: 'POST',
          path: `/${process.env.RELEASE_EMAIL_INVOCATION.split('/')[1]}`,
          headers: {
               'Content-Type': 'application/x-www-form-urlencoded',
               'Content-Length': postData.length,
               'Authorization': `Bearer ${generateServiceToken()}`,
            },
        };

        const req = https.request(options, (res) => {
            switch (res.statusCode) {
                case 400:
                    throw new ResourceError(
                        res.statusMessage,
                        ResourceErrorReason.BAD_REQUEST,
                    );
                case 401:
                    throw new ResourceError(
                        res.statusMessage,
                        ResourceErrorReason.INVALID_ACCESS,
                    );
                case 403:
                    throw new ResourceError(
                        res.statusMessage,
                        ResourceErrorReason.FORBIDDEN,
                    );
                case 500:
                    throw new ServiceError(ServiceErrorReason.INTERNAL);
                default:
            }
        });

        req.on('error', (e) => {
          throw new ServiceError(ServiceErrorReason.INTERNAL);
        });

        req.write(postData);
        req.end();
        return dataStore.addToReleased(releasableObject);
    }
    throw new ResourceError(`${userToken.username} does not have access to release this Learning Object`, ResourceErrorReason.INVALID_ACCESS);
}
