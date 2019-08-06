import { LearningObject } from './learning-object';
/**
 * A full Learning Object and its entire heirarchy
 */
export interface HierarchicalLearningObject extends LearningObject {
    children: HierarchicalLearningObject[];
}
