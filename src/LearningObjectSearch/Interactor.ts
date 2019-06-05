import { LearningObjectSearch as Module } from '.';
import {
  LearningObjectSearchResult,
  Requester,
  LearningObjectSearchQuery,
  QueryCondition,
  LearningObject,
  CollectionAccessMap,
} from './typings';
import { handleError } from '../interactors/LearningObjectInteractor';
import {
  sanitizeText,
  toArray,
  toNumber,
  sanitizeObject,
} from '../shared/functions';
import {
  requesterIsPrivileged,
  requesterIsAdminOrEditor,
} from './AuthorizationManager';
import { LearningObjectDatastore } from './interfaces';
import { getAccessGroupCollections } from '../shared/AuthorizationManager';
import { ResourceErrorReason, ResourceError } from '../shared/errors';

namespace Drivers {
  export const datastore = () =>
    Module.resolveDependency(LearningObjectDatastore);
}

const LearningObjectState = {
  IN_REVIEW: [
    LearningObject.Status.WAITING,
    LearningObject.Status.REVIEW,
    LearningObject.Status.PROOFING,
  ],
  RELEASED: [LearningObject.Status.RELEASED],
};

/**
 *
 *
 * @export
 * @param  {Requester} [Data about the user requesting to search]
 * @param {LearningObjectSearchQuery} []
 *
 * @returns {Promise<LearningObjectSearchResult>}
 */
export async function searchObjects({
  requester,
  query,
}: {
  requester: Requester;
  query: LearningObjectSearchQuery;
}): Promise<LearningObjectSearchResult> {
  try {
    const formattedQuery = formatSearchQuery(query);
    if (requesterIsPrivileged(requester)) {
      let conditions: QueryCondition[];
      let { collection, status } = formattedQuery;
      if (!requesterIsAdminOrEditor(requester)) {
        const privilegedCollections = getAccessGroupCollections(requester);
        const collectionAccessMap = getCollectionAccessMap(
          collection,
          privilegedCollections,
          status,
        );
        const requestedCollections = collection && collection.length > 0;
        conditions = buildCollectionQueryConditions({
          requestedCollections,
          requestedStatuses: status,
          collectionAccessMap,
        });
        collection = null;
        status = null;
      } else {
        status = getAuthAdminEditorStatuses(status);
      }
      return await Drivers.datastore().searchAllObjects({
        ...formattedQuery,
        collection,
        status,
      });
    }
    return await Drivers.datastore().searchReleasedObjects(formattedQuery);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Formats search query to verify params are the appropriate types
 *
 * @private
 * @static
 * @param {LearningObjectSearchQuery} query
 * @returns {LearningObjectSearchQuery}
 * @memberof LearningObjectInteractor
 */
function formatSearchQuery(
  query: LearningObjectSearchQuery,
): LearningObjectSearchQuery {
  const formattedQuery = { ...query };
  formattedQuery.text = sanitizeText(formattedQuery.text) || null;
  formattedQuery.orderBy = sanitizeText(formattedQuery.orderBy, false) || null;
  formattedQuery.status = toArray(formattedQuery.status);
  formattedQuery.length = toArray(formattedQuery.length);
  formattedQuery.level = toArray(formattedQuery.level);
  formattedQuery.collection = toArray(formattedQuery.collection);
  formattedQuery.standardOutcomeIDs = toArray(
    formattedQuery.standardOutcomeIDs,
  );
  formattedQuery.page = toNumber(formattedQuery.page);
  formattedQuery.limit = toNumber(formattedQuery.limit);
  formattedQuery.sortType = <1 | -1>toNumber(formattedQuery.sortType);
  formattedQuery.sortType =
    formattedQuery.sortType === 1 || formattedQuery.sortType === -1
      ? formattedQuery.sortType
      : 1;

  return sanitizeObject({ object: formattedQuery }, false);
}

/**
 * Returns Map of collections to statuses representing read access privilege over associated collection
 *
 * @param {string[]} requestedCollections
 * @param {string[]} privilegedCollections
 * @returns CollectionAccessMap
 */
function getCollectionAccessMap(
  requestedCollections: string[],
  privilegedCollections: string[],
  requestedStatuses: string[],
): CollectionAccessMap {
  if (
    requestedStatuses &&
    (requestedStatuses.includes(LearningObject.Status.REJECTED) ||
      requestedStatuses.includes(LearningObject.Status.UNRELEASED))
  ) {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  const accessMap = {};
  const authStatuses =
    requestedStatuses && requestedStatuses.length
      ? requestedStatuses
      : [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];

  if (requestedCollections && requestedCollections.length) {
    for (const filter of requestedCollections) {
      if (privilegedCollections.includes(filter)) {
        accessMap[filter] = authStatuses;
      } else {
        accessMap[filter] = LearningObjectState.RELEASED;
      }
    }
  } else {
    for (const collection of privilegedCollections) {
      accessMap[collection] = authStatuses;
    }
  }

  return accessMap;
}

/**
 * Builds QueryConditions based on requested collections and collectionAccessMap
 *
 * @private
 * @static
 * @param {boolean} requestedCollections [Represents whether or not specific collections were requested]
 * @param {string[]} requestedStatuses [Array of requested statuses]
 * @param {CollectionAccessMap} collectionAccessMap
 * @returns {QueryCondition[]}
 * @memberof LearningObjectInteractor
 */
function buildCollectionQueryConditions(params: {
  requestedCollections: boolean;
  requestedStatuses: string[];
  collectionAccessMap: CollectionAccessMap;
}): QueryCondition[] {
  const {
    requestedCollections,
    requestedStatuses,
    collectionAccessMap,
  } = params;
  const conditions: QueryCondition[] = [];
  if (!requestedCollections) {
    if (
      !requestedStatuses ||
      (requestedStatuses &&
        requestedStatuses.length === 1 &&
        requestedStatuses[0] === LearningObject.Status.RELEASED)
    ) {
      conditions.push({
        status: LearningObject.Status.RELEASED,
      });
    }
  }

  const mapKeys = Object.keys(collectionAccessMap);
  for (const key of mapKeys) {
    const status = collectionAccessMap[key];
    conditions.push({ collection: key, status });
  }
  return conditions;
}

/**
 * Returns statuses admin and editors have access to. Throws an error if  unauthorized statuses are requested
 *
 * @private
 * @static
 * @param {string[]} status [Array of requested statuses]
 * @returns
 * @memberof LearningObjectInteractor
 */
function getAuthAdminEditorStatuses(status?: string[]): string[] {
  if (!status || (status && !status.length)) {
    return [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];
  }

  if (
    status.includes(LearningObject.Status.REJECTED) ||
    status.includes(LearningObject.Status.UNRELEASED)
  ) {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  return status;
}
