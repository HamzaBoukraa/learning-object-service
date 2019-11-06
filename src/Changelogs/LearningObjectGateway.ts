import { LearningObjectSummary } from '../shared/types';
import { Requester } from './typings';

export abstract class LearningObjectGateway {
  /**
   * Retrieves a summary of the working copy Learning Object
   *
   * @param {Requester} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getReleasedLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary>;

  /**
   * Retrieve a list of Learning Objects for a given CUID
   *
   * @abstract
   * @param {{
   *     requester: Requester,
   *     cuid: string,
   *   }} params
   * @returns {Promise<LearningObjectSummary[]>}
   * @memberof LearningObjectGateway
   */
  abstract getLearningObjectByCuid(params: {
    requester: Requester,
    cuid: string,
  }): Promise<LearningObjectSummary[]>;
}
