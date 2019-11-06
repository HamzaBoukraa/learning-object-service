import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import { LearningObject } from '../../../entity';
import { MongoConnector } from '../../MongoConnector';
import { LearningObjectState } from '../../../types';

/**
 * Checks if Learning Object in released collection has a copy in the objects collection that has a status of not released
 *
 * @param {string} learningObjectCUID [The cuid of the Learning Object to check for an existing version of]
 * @returns {Promise<boolean>}
 * @memberof MongoDriver
 */
export async function learningObjectHasRevision(
  learningObjectCUID: string,
  learningObjectID?: string,
): Promise<any> {
  const db = MongoConnector.client().db('onion');
  const revision = await db
    .collection(COLLECTIONS.LEARNING_OBJECTS)
    .find({ cuid: learningObjectCUID})
    .toArray();
  if (revision.length > 1) {
    return revision.filter(revised => (LearningObjectState.NOT_RELEASED.includes(revised.status)))[0];
  }
  return null;
}
