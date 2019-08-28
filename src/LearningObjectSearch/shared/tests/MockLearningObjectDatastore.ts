import { LearningObjectDatastore } from '../../interfaces';
import { ReleasedLearningObjectSearchQuery, PrivilegedLearningObjectSearchQuery, LearningObjectSearchResult } from '../../typings';
import { Stubs } from '../../../tests/stubs';

export class MockLearningObjectDatastore implements LearningObjectDatastore {
    stubs = new Stubs();

    searchReleasedObjects(params: ReleasedLearningObjectSearchQuery): Promise<LearningObjectSearchResult> {
        throw new Error('Method not implemented.');
    }
    searchAllObjects(params: PrivilegedLearningObjectSearchQuery): Promise<LearningObjectSearchResult> {
        throw new Error('Method not implemented.');
    }
}
