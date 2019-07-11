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
}
