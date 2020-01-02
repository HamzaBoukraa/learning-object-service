import { LearningObject } from '../shared/entity';

export interface RevisionsSearchIndex {
    insertLearningObject(learningObject: LearningObject): Promise<void>;
}
