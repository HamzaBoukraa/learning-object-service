import { HierarchyAdapter } from '../../../LearningObjects/Hierarchy/HierarchyAdapter';
import { HierarchicalLearningObject, LearningObject } from '../../../shared/entity';
import { UserToken } from '../../../shared/types';


export abstract class HierarchyGateway {
    abstract buildHierarchicalLearningObject(learningObject: LearningObject, requester: UserToken): Promise<HierarchicalLearningObject>;
}

export class ModuleHierarchyGateway implements HierarchyGateway {
    async buildHierarchicalLearningObject(learningObject: LearningObject, requester: UserToken) {
        return await HierarchyAdapter.getInstance().buildHierarchicalLearningObject(learningObject, requester);
    }
}
