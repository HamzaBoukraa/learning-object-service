import { LibraryCommunicator } from '../../interfaces/LibraryCommunicator';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';
import { MOCK_OBJECTS } from '../mocks';


export class MockLibraryDriver implements LibraryCommunicator {

    getMetrics(objectID: string): Promise<Metrics> {
        return Promise.resolve(MOCK_OBJECTS.METRICS);
    }

    cleanObjectsFromLibraries(ids: string[]): Promise<void> {
        return Promise.resolve();
    }
}
