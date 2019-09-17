import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import { LearningObject } from '../../../entity';
import { MongoConnector } from '../../MongoConnector';

/**
 * Checks if Learning Object in released collection has a copy in the objects collection that has a status of not released
 *
 * @param {string} learningObjectId [The id of the Learning Object to check for an existing revision of]
 * @returns {Promise<boolean>}
 * @memberof MongoDriver
 */
export async function learningObjectHasRevision(learningObjectId: string): Promise<boolean> {
    const db = MongoConnector.client().db('onion');
    const revision = db.collection(COLLECTIONS.LEARNING_OBJECTS).findOne(
      {
        _id: learningObjectId,
        status: { $ne: LearningObject.Status.RELEASED },
      },
      {
        projection: {
          _id: 1,
        },
      },
    );
    if (revision) {
      return true;
    }
    return false;
}
