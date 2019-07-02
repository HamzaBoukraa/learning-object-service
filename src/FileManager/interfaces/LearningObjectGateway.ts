import { LearningObject } from '../../shared/entity';
import { UserToken } from '../../shared/types';

export abstract class LearningObjectGateway {

  /**
   * Retrieves a summary of the working copy Learning Object
   *
   * @abstract
   * @param {string} id
   * @param {boolean} full
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObject>}
   */
    abstract getLearningObjectById(params: {
        id: string;
        requester: UserToken;
    }): Promise<LearningObject>;
}
