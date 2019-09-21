
import { UserLearningObjectSearchQuery, CollectionAccessMap, LearningObjectSummary } from '../../shared/types';
import { LearningObjectQuery } from '../../shared/interfaces/DataStore';

export abstract class UserLearningObjectDatastore {
    /**
     * Performs aggregation to return all the user's objects that are released
     *
     * @param {LearningObjectQuery} query query containing  for field searching
     * @param {string} username username of an author in CLARK
     */
    abstract searchReleasedUserObjects(
      query: LearningObjectQuery,
      username: string,
    ): Promise<LearningObjectSummary[]>;

    /**
     * Performs aggregation to join the users objects from the released and working collection before
     * searching and filtering based on collectionRestrictions, text or explicitly defined statuses. If collectionRestrictions are
     * Defined, orConditions with statuses are built and the actual status filter will not be used or applied. This only occurs for reviewers
     * and curators. Text searches are are not affected by collection restrictions or the 'orConditions'.
     *
     * @param {UserLearningObjectSearchQuery} query query containing status and text for field searching
     * @param {string} username username of an author in CLARK
     * @param {QueryCondition} conditions Array containing a reviewer or curators requested collections.
     *
     * @returns {LearningObjectSummary[]}
     * @memberof MongoDriver
     */
    abstract searchAllUserObjects(
      query: UserLearningObjectSearchQuery,
      username: string,
      collectionRestrictions?: CollectionAccessMap,
    ): Promise<LearningObjectSummary[]>;
  }
