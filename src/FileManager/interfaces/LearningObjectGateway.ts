import { UserToken, LearningObjectSummary } from '../../shared/types';
import { LearningObjectFilter } from '../../LearningObjects/typings';
import { LearningObject } from '../../shared/entity';

export abstract class LearningObjectGateway {
  abstract getLearningObjectSummary(params: {
    id: string;
    requester: UserToken;
  }): Promise<LearningObjectSummary>;
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

  abstract getLearningObjectById(params: {
    learningObjectId: string;
    requester?: UserToken;
    filter?: LearningObjectFilter;
  }): Promise<LearningObject>;

  abstract getLearningObjectByCuidAndVersion(params: {
    username: string;
    cuid: string;
    version: number;
    requester: UserToken;
  }): Promise<LearningObjectSummary[]>;
}
