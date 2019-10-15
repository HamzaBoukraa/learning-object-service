import { COLLECTIONS } from '../../../drivers/MongoDriver';
import { MongoConnector } from '../../../shared/MongoDB/MongoConnector';

/**
 * Appends the downloaded boolean to the document in the users library on download
 * @param username The username of the user downloading the object
 * @param id The learningObject ID of the learningObject being downloaded
 */
export async function updateObjectInLibraryForDownload(
    username: string,
    id: string,
): Promise<void> {
    console.log(username, id);
    try {
        const db = MongoConnector.client().db('cart-service');
        const library = await db
        .collection(COLLECTIONS.LIBRARY)
        .findOne({ username: username, 'contents.id': id });
        if (library && library.contents && library.contents.length) {
        for (let c of library.contents) {
            if (c.id === id) {
            c.downloaded = true;
            break;
            }
        }
        db
            .collection(COLLECTIONS.LIBRARY)
            .findOneAndReplace({ username: username }, library);
        }
        return Promise.resolve();
    } catch (e) {
        throw new Error(
        `Problem updating LearningObject in library for download. Error: ${e}`,
        );
    }
}
