import { DataStore, ParentLearningObjectQuery } from '../../interfaces/DataStore';
import { UserToken } from '../../types';
import { LearningObject } from '../../entity';
import { toArray, hasReadAccessByCollection, LearningObjectState, handleError } from '../../interactors/LearningObjectInteractor';

/**
 * Fetches Learning Object's parents
 *
 * @returns {Promise<LearningObject[]>} the set of parent Learning Objects
 */
export async function fetchParents(params: {
  dataStore: DataStore;
  query: ParentLearningObjectQuery;
  userToken: UserToken;
  full?: boolean;
  isRequestingRevision?: boolean;
}): Promise<LearningObject[]> {
  try {
    const { dataStore, query, userToken, full, isRequestingRevision } = params;
    const status = await dataStore.fetchLearningObjectStatus(query.id);
    if (status === LearningObject.Status.RELEASED && !isRequestingRevision) {
      return await dataStore.fetchReleasedParentObjects({
        query,
        full,
      });
    } else if (userToken || isRequestingRevision) {
      query.status = toArray(query.status);
      const [collection, author] = await Promise.all([
        dataStore.fetchLearningObjectCollection(query.id),
        dataStore.fetchLearningObjectAuthorUsername(query.id),
      ]);

      const requesterIsAuthor = userToken.username === author;

      const requesterIsPrivileged = hasReadAccessByCollection(collection, userToken);

      if (requesterIsAuthor) {
        query.status = LearningObjectState.ALL;
      } else if (requesterIsPrivileged) {
        query.status = LearningObjectState.IN_REVIEW;
      } else {
        return [];
      }

      return await params.dataStore.fetchParentObjects({
        query,
        full,
      });
    }
    return [];
  } catch (e) {
    handleError(e);
  }
}
