import { LearningObject } from '../../shared/entity';

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
    abstract fetchLearningObject(params: {
        id: string,
        full: boolean,
    }): Promise<LearningObject>;
}