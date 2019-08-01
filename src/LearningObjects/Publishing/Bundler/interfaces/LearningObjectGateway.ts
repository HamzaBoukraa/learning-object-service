import { LearningObject, UserToken } from '../typings';
import { LearningObjectFilter } from '../../../typings';

export abstract class LearningObjectGateway {

    /**
     *
     *
     * @abstract
     * @param {string} id
     * @returns {Promise<LearningObject>}
     * @memberof LearningObjectGateway
     */
    abstract fetchLearningObject(params: {
        id: string,
        requester: UserToken,
        filter?: LearningObjectFilter,
    }): Promise<LearningObject>;
}
