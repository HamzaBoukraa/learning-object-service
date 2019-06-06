import {
  LearningObjectSearchQuery,
  LearningObjectSearchResult,
  PrivilegedLearningObjectSearchQuery,
} from '../typings';

export abstract class LearningObjectDatastore {
  /**
   * Performs search on Released Learning Objects
   *
   * @abstract
   * @param {LearningObjectSearchQuery} params [Search and filter parameters]
   * @returns {Promise<LearningObjectSearchResult>}
   * @memberof LearningObjectDatastore
   */
  abstract searchReleasedObjects(
    params: LearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult>;

  /**
   * Performs search on all Released and Submitted Learning Objects
   *
   * @abstract
   * @param {PrivilegedLearningObjectSearchQuery} params [Search and filter parameters]
   * @returns {Promise<LearningObjectSearchResult>}
   * @memberof LearningObjectDatastore
   */
  abstract searchAllObjects(
    params: PrivilegedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult>;
}
