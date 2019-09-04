import {
  LearningObject,
  HierarchicalLearningObject,
} from '../../../shared/entity';
import { UserToken } from '../../../shared/types';
import { LearningObjectAdapter } from '../../adapters/LearningObjectAdapter';

/**
 * buildHierarchicalLearningObject takes a Learning Object and
 * uses it to generate a HierarchicalLearningObject.
 * The function iterates over the children array for the given
 * Learning Object and generates a full Learning Object
 * for each child. This function recurses for every child
 * until no exist.
 * @param { LearningObject }learningObject
 * @param { UserToken }requester
 */
export async function buildHierarchicalLearningObject(
  learningObject: LearningObject,
  requester: UserToken,
): Promise<HierarchicalLearningObject> {
  const hierarchyBuilderPromise = learningObject.children.map(async child => {
    const fullChild = await LearningObjectAdapter.getInstance().getLearningObjectById(
      { id: child.id, requester },
    );
    if (fullChild.children.length > 0) {
      return await buildHierarchicalLearningObject(fullChild, requester);
    }
    return fullChild as HierarchicalLearningObject;
  });
  const hierarchy: HierarchicalLearningObject = learningObject as HierarchicalLearningObject;
  hierarchy.children = await Promise.all(hierarchyBuilderPromise);
  return hierarchy;
}
