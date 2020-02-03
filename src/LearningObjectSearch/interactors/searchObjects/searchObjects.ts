import { LearningObjectSearch as Module } from '../..';
import {
  LearningObjectSearchResult,
  Requester,
  LearningObjectSearchQuery,
  CollectionAccessMap,
  LearningObjectState,
} from '../../typings';
import {
  sanitizeText,
  toArray,
  toNumber,
  sanitizeObject,
} from '../../../shared/functions';
import {
  requesterIsPrivileged,
  requesterIsAdminOrEditor,
  getAuthorizedStatuses,
} from '../../../shared/AuthorizationManager';
import { LearningObjectDatastore } from '../../interfaces';
import { getAccessGroupCollections } from '../../../shared/AuthorizationManager';
import { handleError } from '../../../shared/errors';

namespace Drivers {
  export const datastore = () =>
    Module.resolveDependency(LearningObjectDatastore);
}

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
  formattedQuery.standardOutcomes = toArray(formattedQuery.standardOutcomes);
  formattedQuery.guidelines = toArray(formattedQuery.guidelines);
  formattedQuery.includes = toArray(formattedQuery.includes);
  formattedQuery.page = toNumber(formattedQuery.page);
  formattedQuery.limit = toNumber(formattedQuery.limit);
  formattedQuery.sortType = <1 | -1>toNumber(formattedQuery.sortType);
  formattedQuery.sortType =
    formattedQuery.sortType === 1 || formattedQuery.sortType === -1
      ? formattedQuery.sortType
      : 1;
  if (formattedQuery.guidelines && formattedQuery.guidelines.includes('NICE KSAs')) {
    formattedQuery.guidelines.push('NCWF KSAs');
  } else if (formattedQuery.guidelines && formattedQuery.guidelines.includes('NICE Tasks')) {
    formattedQuery.guidelines.push('NCWF Tasks');
  }
  console.log('Paige', formattedQuery.includes);
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
      }
    }
  } else {
    for (const collection of privilegedCollections) {
      accessMap[collection] = requestedStatuses;
    }
  }

  return accessMap;
}
