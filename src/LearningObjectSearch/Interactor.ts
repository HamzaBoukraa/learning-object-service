import { LearningObjectSearch as Module } from '.';
import {
  LearningObjectSearchResult,
  Requester,
  LearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
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

namespace Drivers {
  export const datastore = () =>
    Module.resolveDependency(LearningObjectDatastore);
}

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
      return await Drivers.datastore().searchAllObjects(formattedQuery);
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
