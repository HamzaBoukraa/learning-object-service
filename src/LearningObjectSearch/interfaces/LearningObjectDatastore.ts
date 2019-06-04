import {
  ReleasedLearningObjectSearchQuery,
  LearningObjectSearchQuery,
  LearningObjectSearchResult,
} from '../typings';

export abstract class LearningObjectSearchGateway {
  /**
   * Performs search on Released Learning Objects
   *
   * @abstract
   * @param {ReleasedLearningObjectSearchQuery} params [Search and filter parameters]
   * @returns {Promise<LearningObjectSearchResult>}
   * @memberof LearningObjectSearchGateway
   */
  abstract searchReleasedObjects(
    params: ReleasedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult>;

  /**
   * Performs search on all Released and Submitted Learning Objects
   *
   * @abstract
   * @param {LearningObjectSearchQuery} params [Search and filter parameters]
   * @returns {Promise<LearningObjectSearchResult>}
   * @memberof LearningObjectSearchGateway
   */
  abstract searchAllObjects(
    params: LearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult>;
}
