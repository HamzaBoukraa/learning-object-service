import { LearningObjectSearch as Module } from '.';
import {
  LearningObjectSearchResult,
  Requester,
  LearningObjectSearchQuery,
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
      let collectionRestrictions: CollectionAccessMap;
      let { collection, status } = formattedQuery;
      status = getAuthorizedPrivilegedStatuses(status);
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
  statuses: string[],
): CollectionAccessMap {
  const accessMap = {};
  if (requestedCollections && requestedCollections.length) {
    for (const filter of requestedCollections) {
      if (privilegedCollections.includes(filter)) {
        accessMap[filter] = statuses;
      } else {
        accessMap[filter] = LearningObjectState.RELEASED;
      }
    }
  } else {
    for (const collection of privilegedCollections) {
      accessMap[collection] = statuses;
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
function getAuthorizedPrivilegedStatuses(status?: string[]): string[] {
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
