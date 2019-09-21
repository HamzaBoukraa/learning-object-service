import {
  UserToken,
  UserLearningObjectQuery,
  LearningObjectSummary,
  UserLearningObjectSearchQuery,
  LearningObjectState,
  CollectionAccessMap,
} from '../../../shared/types';
import {
  ResourceError,
  ResourceErrorReason,
  handleError,
} from '../../../shared/errors';
import {
  requesterIsAuthor,
  requesterIsPrivileged,
  getAuthorizedStatuses,
  requesterIsAdminOrEditor,
  getAccessGroupCollections,
  getCollectionAccessMap,
} from '../../../shared/AuthorizationManager';
import { LearningObject } from '../../../shared/entity';
import {
  sanitizeText,
  sanitizeObject,
  toArray,
  toBoolean,
  mapLearningObjectToSummary,
} from '../../../shared/functions';
import { LearningObjectSearch } from '../..';
import { UserLearningObjectDatastore } from '../../interfaces/UserLearningObjectDatastore';
import { UserGateway } from '../../interfaces/UserGateway';

namespace Gateways {
  export const userGateway = () =>
    LearningObjectSearch.resolveDependency(UserGateway);

  export const userLearningObjectDatastore = () =>
    LearningObjectSearch.resolveDependency(UserLearningObjectDatastore);
}
const GATEWAY_API = process.env.GATEWAY_API;

/**
 * Performs a search on the specified user's Learning Objects.
 *
 * *** NOTES ***
 * If the specified user cannot be found, a NotFound ResourceError is thrown.
 * Only the author and privileged users are allowed to view Learning Object drafts.
 * "Drafts" are defined as 'not released' Learning Objects that have never been released or have a `revision` id of `0`, so
 * if the `draftsOnly` filter is specified, the `status` filter must not have a value of `released`.
 * Only authors can see drafts that are not submitted for review; `unreleased` || `rejected`.
 * Admins and editors can see all Learning Objects submitted for review.
 * Reviewers and curators can only see Learning Objects submitted for review to their collection.
 *
 *
 * @async
 *
 * @returns {LearningObjectSummary[]} the user's learning objects found by the query
 * @param params.authorUsername
 * @param params.requester
 * @param params.query
 */
export async function searchUsersObjects({
  authorUsername,
  requester,
  query,
}: {
  authorUsername: string;
  requester: UserToken;
  query?: UserLearningObjectQuery;
}): Promise<LearningObjectSummary[]> {
  try {
    let { text, draftsOnly, status } = formatUserLearningObjectQuery(query);
    const isAuthor = requesterIsAuthor({ requester, authorUsername });
    const isPrivileged = requesterIsPrivileged(requester);
    const searchQuery: UserLearningObjectSearchQuery = {
      text,
      status,
    };
    let learningObjects: LearningObject[];
    if (draftsOnly) {
      if (!isAuthor && !isPrivileged) {
        throw new ResourceError(
          `Invalid access. You are not authorized to view ${authorUsername}'s drafts.`,
          ResourceErrorReason.INVALID_ACCESS,
        );
      }

      if (!searchQuery.status) {
        if (isAuthor) {
          searchQuery.status = [
            ...LearningObjectState.UNRELEASED,
            ...LearningObjectState.IN_REVIEW,
          ];
        } else {
          searchQuery.status = [...LearningObjectState.IN_REVIEW];
        }
      }

      if (searchQuery.status.includes(LearningObject.Status.RELEASED)) {
        throw new ResourceError(
          'Illegal query arguments. Cannot specify both draftsOnly and released status filters.',
          ResourceErrorReason.BAD_REQUEST,
        );
      }

      searchQuery.revision = 0;
    }

    const user = await Gateways.userGateway().getUser(authorUsername);
    if (!user) {
      throw new ResourceError(
        `Cannot load Learning Objects for user ${authorUsername}. User ${authorUsername} does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }

    if (!isAuthor && !isPrivileged) {
      learningObjects = await Gateways.userLearningObjectDatastore().searchReleasedUserObjects(
        searchQuery,
        user.id,
      );
      const releasedLearningObjectSummaries = learningObjects.map(objects => {
        objects.attachResourceUris(GATEWAY_API);
        return mapLearningObjectToSummary(objects);
      });
      return releasedLearningObjectSummaries;
    }

    let collectionAccessMap: CollectionAccessMap;

    if (!isAuthor) {
      searchQuery.status = getAuthorizedStatuses(searchQuery.status);
      if (!requesterIsAdminOrEditor(requester)) {
        const privilegedCollections = getAccessGroupCollections(requester);
        collectionAccessMap = getCollectionAccessMap(
          [],
          privilegedCollections,
          searchQuery.status,
        );
        searchQuery.status = searchQuery.status.includes(
          LearningObject.Status.RELEASED,
        )
          ? LearningObjectState.RELEASED
          : null;
      }
    }

    learningObjects = await Gateways.userLearningObjectDatastore().searchAllUserObjects(
      searchQuery,
      user.id,
      collectionAccessMap,
    );
    const learningObjectSummaries = learningObjects.map(objects => {
      objects.attachResourceUris(GATEWAY_API);
      return mapLearningObjectToSummary(objects);
    });
    return learningObjectSummaries;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Formats search query to verify params are the appropriate types
 *
 * @private
 * @static
 * @param {UserLearningObjectQuery} query
 * @returns {UserLearningObjectQuery}
 */
function formatUserLearningObjectQuery(
  query: UserLearningObjectQuery,
): UserLearningObjectQuery {
  const formattedQuery = { ...query };
  formattedQuery.text = sanitizeText(formattedQuery.text) || null;
  formattedQuery.status = toArray(formattedQuery.status);
  formattedQuery.draftsOnly = toBoolean(formattedQuery.draftsOnly);
  return sanitizeObject({ object: formattedQuery }, false);
}
