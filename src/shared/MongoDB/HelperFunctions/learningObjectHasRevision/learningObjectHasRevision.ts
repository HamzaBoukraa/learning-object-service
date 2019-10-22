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
  learningObjectID: string,
): Promise<boolean> {
  const db = MongoConnector.client().db('onion');
  const revision = await db
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
            status: { $in: LearningObjectState.NOT_RELEASED },
          },
        },
      },
      { $unwind: { path: '$workingCopy', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'workingCopy._id': { $ne: learningObjectID },
          'workingCopy.status': { $in: LearningObjectState.NOT_RELEASED },
          'workingCopy.isRevision': true,
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
  if (revision.length > 0) {
    return true;
  }
  return false;
}
