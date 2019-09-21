import { LearningObject } from '../../../entity';
import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import * as mongoHelperFunctions from '..';

/**
 * Loads released child objects
 *
 * @param {{
 *     id: string;
 *     full?: boolean;
 *   }} params
 * @returns {Promise<LearningObject[]>}
 * @memberof MongoDriver
 */
export async function loadReleasedChildObjects(params: {
  id: string;
  full?: boolean;
}): Promise<LearningObject[]> {
  return mongoHelperFunctions.loadChildObjects({
    ...params,
    collection: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
    status: [LearningObject.Status.RELEASED],
  });
}
