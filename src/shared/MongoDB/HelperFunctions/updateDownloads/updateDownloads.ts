import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import { MongoConnector } from '../../MongoConnector';
import { LearningObject } from '../../../entity';
import { UserToken } from '../../../types';


/**
 * Appends the downloaded boolean to the document in the users library on download
 * @param username The username of the user downloading the object
 * @param id The learningObject ID of the learningObject being downloaded
 */
export async function updateDownloads(
    user: UserToken,
    downloadedLearningObject: LearningObject,
): Promise<void> {
    const downloadObject = cleanObject(user, downloadedLearningObject);
    const db = MongoConnector.client().db('cart-service');
    await db.collection(COLLECTIONS.DOWNLOADS).insert(downloadObject);
}


function cleanObject(user: UserToken, object: LearningObject) {
    const downloadObject = {
        learningObjectCuid: object.cuid,
        learningObjectVersion: object.version,
        timestamp: Date.now(),
        downloadedBy : {
            username: user.username,
            name: user.name,
            email: user.email,
            organization: user.organization,
        },
    };
    return downloadObject;
}
