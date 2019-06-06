import { LearningObjectSearch as Module } from '.';
import {
  LearningObjectSearchResult,
  Requester,
  LearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
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
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { getAccessGroupCollections } from '../shared/AuthorizationManager';

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
 * Searches for Learning Objects based on provided query parameters and access level
 *
 * If the user is not privileged, their search is only applied to released Learning Objects
 * If the user is privileged, the requested statuses must not contain statuses with restrictive access,
 * additionally, if the user is a curator or reviewer, we must appropriately apply specified statuses and collection filters based on their access level on a per collection basis
 *
 * @export
 * @param  {Requester} [Data about the user requesting to search]
 * @param {LearningObjectSearchQuery} [Search query parameters]
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
      let collectionRestrictions: CollectionAccessMap;
      let { collection, status } = formattedQuery;
      status = getAuthorizedStatuses(status);
      if (!requesterIsAdminOrEditor(requester)) {
        const privilegedCollections = getAccessGroupCollections(requester);
        collectionRestrictions = getCollectionAccessMap(
          collection,
          privilegedCollections,
          status,
        );
        status = LearningObjectState.RELEASED;
      }
      return await Drivers.datastore().searchAllObjects({
        ...formattedQuery,
        status,
        collectionRestrictions,
      });
    }
    return await Drivers.datastore().searchReleasedObjects(formattedQuery as PrivilegedLearningObjectSearchQuery);
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
 * @param {string[]} requestedCollections [List of collections the user has specified]
 * @param {string[]} privilegedCollections [List of collections the user has privileged access on]
 * @param {string[]} requestedStatuses [List of requested statuses]
 * @returns CollectionAccessMap
 */
function getCollectionAccessMap(
  requestedCollections: string[],
  privilegedCollections: string[],
  requestedStatuses: string[],
): CollectionAccessMap {
  const accessMap = {};
  if (requestedCollections && requestedCollections.length) {
    for (const filter of requestedCollections) {
      if (privilegedCollections.includes(filter)) {
        accessMap[filter] = requestedStatuses;
      } else {
        accessMap[filter] = LearningObjectState.RELEASED;
      }
    }
  } else {
    for (const collection of privilegedCollections) {
      accessMap[collection] = requestedStatuses;
    }
  }

  return accessMap;
}

/**
 * Validates and returns authorized statuses for privileged users
 *
 * @param {string[]} [status]
 * @returns {string[]}
 */
function getAuthorizedStatuses(status?: string[]): string[] {
  enforceStatusRestrictions(status);
  if (!status || (status && !status.length)) {
    return [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];
  }

  return status;
}

/**
 * Validates requested statuses do not contain restricted statuses
 *
 * If statues requested contain a restricted status, An invalid access error is thrown
 *
 * @param {string[]} status
 */
function enforceStatusRestrictions(status: string[]) {
  if (
    status &&
    (status.includes(LearningObject.Status.REJECTED) ||
      status.includes(LearningObject.Status.UNRELEASED))
  ) {
    throw new ResourceError(
      'The statuses requested are not permitted.',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}
