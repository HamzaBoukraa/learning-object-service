import { COLLECTIONS } from '../../../drivers/MongoDriver';
import { MongoConnector } from '../../../shared/MongoDB/MongoConnector';
import { LearningObjectSummary } from '../../../shared/types';

/**
 * Appends the downloaded boolean to the document in the users library on download
 * @param username The username of the user downloading the object
 * @param id The learningObject ID of the learningObject being downloaded
 */
export async function updateObjectInLibraryForDownload(
    username: string,
    learningObject: LearningObjectSummary,
): Promise<void> {
    try {
        const db = MongoConnector.client().db('cart-service');
        const library = await db
        .collection(COLLECTIONS.LIBRARY)
        .findOne({ username: username, 'contents.id': learningObject.id });

        library.libraryItem = {
            savedOn: Date.now(),
            savedBy: username,
            learningObject: learningObject,
            downloaded: true,
        };
        db
            .collection(COLLECTIONS.LIBRARY)
            .findOneAndReplace({ username: username }, library);
        return Promise.resolve();
    } catch (e) {
        throw new Error(
        `Problem updating LearningObject in library for download. Error: ${e}`,
        );
    }
}
