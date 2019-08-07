import { LibraryCommunicator } from '../../shared/interfaces/LibraryCommunicator';
import { LearningObject } from '../../shared/entity';
import { Stubs } from '../stubs';

export class MockLibraryDriver implements LibraryCommunicator {
  stubs = new Stubs();

  getMetrics(objectID: string): Promise<LearningObject.Metrics> {
    return Promise.resolve({ saves: 0, downloads: 0 });
  }

  cleanObjectsFromLibraries(ids: string[]): Promise<void> {
    return Promise.resolve();
  }
}
