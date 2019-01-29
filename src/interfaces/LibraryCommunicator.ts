import { LearningObject } from '@cyber4all/clark-entity';

export interface LibraryCommunicator {
  getMetrics(objectID: string): Promise<LearningObject.Metrics>;
  cleanObjectsFromLibraries(ids: Array<string>): Promise<void>;
}
