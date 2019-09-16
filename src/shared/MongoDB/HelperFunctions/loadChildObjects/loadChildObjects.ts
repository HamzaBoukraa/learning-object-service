import { LearningObject } from '../../../entity';
import { COLLECTIONS } from '../../../../drivers/MongoDriver';
import * as mongoHelperFunctions from '..';
import { LearningObjectDocument } from '../../../types';
import { MongoConnector } from '../../MongoConnector';

/**
 *  Fetches all child objects for object with given parent id and status starting with a match, then performing a
 *  lookup to grab the children of the specified parent and returning only the children
 *
 * @param {string} id
 * @returns {Promise<LearningObject[]>}
 * @memberof MongoDriver
 */
export async function loadChildObjects(params: {
  id: string;
  full?: boolean;
  status: string[];
  collection?: string;
}): Promise<LearningObject[]> {
  const db = MongoConnector.client().db('onion');
  const { id, full, status, collection } = params;
  const matchQuery: { [index: string]: any } = {
    $match: { _id: id },
  };

  const findChildren: {
    $graphLookup: {
      from: string;
      startWith: string;
      connectFromField: string;
      connectToField: string;
      as: string;
      maxDepth: number;
      restrictSearchWithMatch?: { [index: string]: any };
    };
  } = {
    $graphLookup: {
      from: collection || COLLECTIONS.LEARNING_OBJECTS,
      startWith: '$children',
      connectFromField: 'children',
      connectToField: '_id',
      as: 'objects',
      maxDepth: 0,
    },
  };
  if (status) {
    findChildren.$graphLookup.restrictSearchWithMatch = {
      status: { $in: status },
    };
  }
  const docs = await db
    .collection<{ objects: LearningObjectDocument[] }>(
      collection || COLLECTIONS.LEARNING_OBJECTS,
    )
    .aggregate([
      // match based on id's and status array if given.
      matchQuery,
      findChildren,
      // only return children.
      { $project: { _id: 0, objects: '$objects' } },
    ])
    .toArray();
  if (docs[0]) {
    const objects = docs[0].objects;

    return mongoHelperFunctions.bulkGenerateLearningObjects(objects, full);
  }
  return [];
}
