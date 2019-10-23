import { COLLECTIONS } from '../../../drivers/MongoDriver';
import { MongoConnector } from '../../../shared/MongoDB/MongoConnector';
import { LearningObject, LibraryItem } from '../../../shared/entity';


/**
 * Appends the downloaded boolean to the document in the users library on download
 * @param username The username of the user downloading the object
 * @param id The learningObject ID of the learningObject being downloaded
 */
export async function updateObjectInLibraryForDownload(
    username: string,
    downloadedLearningObject: LearningObject,
): Promise<void> {
    try {
        const db = MongoConnector.client().db('cart-service');
        const libraryItem: LibraryItem = {
            savedOn: Date.now(),
            savedBy: username,
            learningObject: downloadedLearningObject,
            downloaded: true,
        };

        let currentItem = await db
        .collection(COLLECTIONS.LIBRARY)
        .findOne({ savedBy: username, 'learningObject._id': downloadedLearningObject.id });

        if (currentItem) {
            db
                .collection(COLLECTIONS.LIBRARY)
                .findOneAndReplace(currentItem, libraryItem);
        } else {
            db
                .collection(COLLECTIONS.LIBRARY)
                .insertOne(libraryItem);
        }
        return Promise.resolve();
    } catch (e) {
        throw new Error(
        `Problem updating LearningObject in library for download. Error: ${e}`,
        );
    }
}
