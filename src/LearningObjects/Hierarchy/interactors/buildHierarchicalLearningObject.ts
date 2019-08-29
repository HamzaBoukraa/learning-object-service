import { LearningObject, HierarchicalLearningObject } from '../../../shared/entity';
import { UserToken } from '../../../shared/types';
import { LearningObjectAdapter } from '../../adapters/LearningObjectAdapter';

// TODO: Move to Hierarchy Module and write tests
export async function buildHierarchicalLearningObject(learningObject: LearningObject, requester: UserToken): Promise<HierarchicalLearningObject> {
    // 1. Fetch full children from summaries of children
    // 2. If the full children have children (grandchildren)
    const hierarchyBuilderPromise = learningObject.children.map(async child => {
      const fullChild = await LearningObjectAdapter.getInstance().getLearningObjectById({ id: child.id, requester });
      if (fullChild.children.length > 0) {
        return await buildHierarchicalLearningObject(fullChild, requester);
      }
      return fullChild as HierarchicalLearningObject;
    });
    const hierarchy: HierarchicalLearningObject = learningObject as HierarchicalLearningObject;
    hierarchy.children = await Promise.all(hierarchyBuilderPromise);
    return hierarchy;
}

