import { LibraryCommunicator } from '../../shared/interfaces/LibraryCommunicator';
import { MOCK_OBJECTS } from '../mocks';
import { LearningObject } from '../../shared/entity';

export class MockLibraryDriver implements LibraryCommunicator {
  getMetrics(objectID: string): Promise<LearningObject.Metrics> {
    return Promise.resolve(MOCK_OBJECTS.METRICS);
  }

  cleanObjectsFromLibraries(ids: string[]): Promise<void> {
    return Promise.resolve();
  }
}
