import { LearningObject } from '../entity';

export interface LibraryCommunicator {
  getMetrics(objectID: string): Promise<LearningObject.Metrics>;
}
