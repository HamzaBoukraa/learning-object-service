import { LearningObjectGateway } from '../../interfaces';
import { LearningObject, UserToken } from '../../typings';
import { LearningObjectAdapter } from '../../../../adapters/LearningObjectAdapter';
import { LearningObjectFilter } from '../../../../typings';

export class ModuleLearningObjectGateway implements LearningObjectGateway {
   async fetchLearningObject(params: {
        id: string,
        requester: UserToken,
        filter: LearningObjectFilter,
    }): Promise<LearningObject> {
       return await LearningObjectAdapter.getInstance().getLearningObjectById(params);
    }

}
