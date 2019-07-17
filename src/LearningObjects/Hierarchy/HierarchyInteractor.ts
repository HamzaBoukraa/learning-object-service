import { DataStore, ParentLearningObjectQuery } from '../../shared/interfaces/DataStore';
import { UserToken, LearningObjectState } from '../../shared/types';
import { LearningObject } from '../../shared/entity';

/**
 * Fetches the parents of a Learning Object.
 *
 * If the user has privileged access to Learning Objects in the Review Stage
 * for any collection(s), then those parent Learning Objects will also be returned.
 * In this case, when there is a released Learning Object and a working copy,
 * the released copy will be what is returned.
 *
 * @returns {Promise<LearningObject[]>} the set of parent Learning Objects.
 */
export async function fetchParents(params: {
  dataStore: DataStore;
  learningObjectID: string;
  userToken: UserToken;
  full?: boolean;
}): Promise<LearningObject[]> {
  const { dataStore, learningObjectID, userToken, full } = params;
  let hasFullAccess = false;
  let collectionsWithAccess: string[] = [];
  let requestedByAuthor = false;
  const author = await dataStore.fetchLearningObjectAuthorUsername(learningObjectID);

  if (userToken) {
    hasFullAccess = hasFullReviewStageAccess(userToken.accessGroups);
    collectionsWithAccess = identifyCollectionAccess(userToken.accessGroups);
    requestedByAuthor = userToken.username === author;
  }

  if (!requestedByAuthor && !hasFullAccess && collectionsWithAccess.length < 1) {
    return await dataStore.fetchReleasedParentObjects({
      query: { id: learningObjectID },
      full,
    });
  } else {
    return await params.dataStore.fetchParentObjects({
      query: buildQuery(learningObjectID, requestedByAuthor, hasFullAccess, collectionsWithAccess),
      full,
    });
  }
}

/**
 * Checks if the given learning object id belongs to a parent object
 *
 *
 * @returns {Promise<boolean>} false if Learning Object has one or more parents
 */
export async function isTopLevelLearningObject(params: {
  dataStore: DataStore;
  learningObjectID: string;
}): Promise<boolean> {
  const { dataStore, learningObjectID } = params;
  const parentId = await dataStore.findParentObjectId({
    childId: learningObjectID,
  });
  return parentId === null;
}

/**
 * Creates a ParentLearningObjectQuery based on information about the requester.
 *
 * @param learningObjectID the id of the Learning Object to find parents for.
 * @param requestedByAuthor if the request came from the author of the Learning Object.
 * @param hasFullAccess if the requester has access to all Review Stage Learning Objects
 * @param collectionsWithAccess the collections the requester has access to Review Stage
 * Learning Objects in.
 * @returns {ParentLearningObjectQuery} the query to pass to the DataStore.
 */
function buildQuery(learningObjectID: string, requestedByAuthor: boolean, hasFullAccess: boolean, collectionsWithAccess: string[]) {
  const query: ParentLearningObjectQuery = {
    id: learningObjectID,
  };
  // IF they are the author THEN return all parent objects
  if (requestedByAuthor) {
    query.status = LearningObjectState.ALL;
  // IF they have review stage access THEN return parent objects in review and released
  } else if (hasFullAccess) {
    query.status = [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];
  } else if (collectionsWithAccess.length > 0) {
    query.status = [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];
    query.collections = collectionsWithAccess;
  }
  return query;
}

/**
 * Identifies if the requester has access to all Learning Objects that
 * are in the Review Stage. This applies to admins and editors only.
 *
 * @param accessGroups the access groups that a User belongs to.
 * @returns whether or not the requester has full Review Stage access.
 */
function hasFullReviewStageAccess(accessGroups: string[]): boolean {
  if (!accessGroups) return false;
  return accessGroups.includes('admin') || accessGroups.includes('editor');
}

/**
 * Takes a set of access groups and filters them down to any that conform to the
 * structure of {role}@{collection}. Then the role and deliminator are stripped
 * off, and the result is a set of collections that the user has privileged access
 * to.
 * @param accessGroups the access groups that a User belongs to.
 * @returns {string[]} the collections a user has privileged access to.
 */
function identifyCollectionAccess(accessGroups: string[]): string[] {
  const collectionAccessGroups = accessGroups.filter(role => role.includes('@'));
  const collections = [];
  for (const group of collectionAccessGroups) {
    const access = group.split('@');
    collections.push(access[1]);
  }
  return collections;
}
