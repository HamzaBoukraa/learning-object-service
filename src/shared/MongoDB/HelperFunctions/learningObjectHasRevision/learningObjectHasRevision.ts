import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import { LearningObject } from '../../../entity';
import { MongoConnector } from '../../MongoConnector';
import { LearningObjectState } from '../../../types';

/**
 * Checks if Learning Object in released collection has a copy in the objects collection that has a status of not released
 *
 * @param {string} learningObjectId [The id of the Learning Object to check for an existing revision of]
 * @returns {Promise<boolean>}
 * @memberof MongoDriver
 */
export async function learningObjectHasRevision(
  learningObjectCUID: string,
): Promise<boolean> {
  const db = MongoConnector.client().db('onion');
  const revision = db
    .collection(COLLECTIONS.LEARNING_OBJECTS)
    .aggregate([
      {
        $match: {
          cuid: learningObjectCUID,
          status: { $ne: LearningObject.Status.RELEASED },
        },
      },
      {
        $graphLookup: {
          from: 'objects',
          startWith: '$cuid',
          connectFromField: 'cuid',
          connectToField: 'cuid',
          as: 'workingCopy',
          restrictSearchWithMatch: {
            status: LearningObject.Status.RELEASED,
          },
        },
      },
      { $unwind: { path: '$workingCopy', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'workingCopy.status': { $in: LearningObjectState.IN_REVIEW },
        },
      },
      {
        $replaceRoot: {
          newRoot: '$workingCopy',
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
    ])
    .toArray();
  if (revision) {
    return true;
  }
  return false;
}
