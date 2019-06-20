import { LearningObjectSummary, Requester } from '../typings';

export abstract class LearningObjectGateway {
  /**
   * Retrieves a summary of the working copy Learning Object
   *
   * @param {Requester} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getWorkingLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary>;
  /**
   * Retrieves the Learning Object copy that is furthest along in the review pipeline
   *
   * @param {Requester} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getActiveLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary>;
  /**
   * Retrieves Learning Object summary by id and revision number
   *
   * @param {DataStore} dataStore [Driver for datastore]
   * @param {UserToken} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @param {number} revision [Revision number of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getLearningObjectRevisionSummary(params: {
    requester: Requester;
    id: string;
    revision: number;
  }): Promise<LearningObjectSummary>;
}
