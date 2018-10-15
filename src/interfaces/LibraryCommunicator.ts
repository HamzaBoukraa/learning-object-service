import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';

export interface LibraryCommunicator {
    getMetrics(objectID: string): Promise<Metrics>;
    cleanObjectsFromLibraries(ids: Array<string>): Promise<void>;
}
