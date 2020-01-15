import { LearningObject } from '../../../shared/entity';

export abstract class TopicsDatastore {
    abstract getLearningObjectsByTopic(topic: string): Promise<LearningObject[]>;
}
