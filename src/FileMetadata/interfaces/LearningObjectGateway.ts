import {
  LearningObjectSummary,
  Requester,
  LearningObjectFile,
} from '../typings';

export abstract class LearningObjectGateway {
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
   * Sends request to update Learning Object's last modified date
   *
   * @abstract
   * @param {string} id [Id of the Learning Object to update]
   * @returns {Promise<void>}
   * @memberof LearningObjectGateway
   */
  abstract updateObjectLastModifiedDate(id: string): Promise<void>;
}
