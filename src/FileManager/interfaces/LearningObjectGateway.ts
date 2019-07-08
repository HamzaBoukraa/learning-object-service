import { UserToken, LearningObjectSummary } from '../../shared/types';

export abstract class LearningObjectGateway {
  /**
   * Retrieves a summary of the working copy Learning Object
   *
   * @param {UserToken} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getWorkingLearningObjectSummary(params: {
    requester: UserToken;
    id: string;
  }): Promise<LearningObjectSummary>;

  /**
   * Retrieves a summary of the released copy Learning Object
   *
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getReleasedLearningObjectSummary(
    id: string,
  ): Promise<LearningObjectSummary>;

  /**
   * Retrieves a summary of the active copy Learning Object
   *
   * @param {UserToken} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getActiveLearningObjectSummary(params: {
    requester: UserToken;
    id: string;
  }): Promise<LearningObjectSummary>;
}
