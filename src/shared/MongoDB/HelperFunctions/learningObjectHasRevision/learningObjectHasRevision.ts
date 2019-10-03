import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import { LearningObject } from '../../../entity';
import { MongoConnector } from '../../MongoConnector';
import { LearningObjectState } from '../../../types';

/**
 * Checks if Learning Object in released collection has a copy in the objects collection that has a status of not released
 *
 * @param {string} version [The id of the Learning Object to check for an existing version of]
 * @returns {Promise<boolean>}
 * @memberof MongoDriver
 */
export async function learningObjectHasRevision(
  learningObjectCUID: string,
): Promise<string> {
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
    console.log('revision', revision);
  if (revision) {
    return 'hi';
    // return `${process.env.GATEWAY_API}/users/${revision.author.username}/learning-objects/${revision.id}/revisions/${revision.version}`;
  }
  return 'bye';
}
