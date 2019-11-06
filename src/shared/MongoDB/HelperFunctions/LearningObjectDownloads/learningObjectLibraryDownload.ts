import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import { MongoConnector } from '../../../MongoDB/MongoConnector';
import { LearningObject, LibraryItem } from '../../../entity';


/**
 * Appends the downloaded boolean to the document in the users library on download
 * @param username The username of the user downloading the object
 * @param id The learningObject ID of the learningObject being downloaded
 */
export async function updateObjectInLibraryForDownload(
    username: string,
    downloadedLearningObject: LearningObject,
): Promise<void> {
    const db = MongoConnector.client().db('cart-service');
    await db.collection(COLLECTIONS.LIBRARY).updateOne({ savedBy: username, cuid: downloadedLearningObject.cuid }, { $set: {downloaded: true }});
}
