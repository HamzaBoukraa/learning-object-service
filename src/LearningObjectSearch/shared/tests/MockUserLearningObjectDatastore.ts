import { UserLearningObjectDatastore } from '../../interfaces/UserLearningObjectDatastore';
import { LearningObjectQuery } from '../../../shared/interfaces/DataStore';
import { LearningObjectSummary, UserLearningObjectSearchQuery, CollectionAccessMap } from '../../../shared/types';
import { Stubs } from '../../../tests/stubs';
import { mapLearningObjectToSummary } from '../../../shared/functions';

export class MockUserLearningObjectDatastore implements UserLearningObjectDatastore {
    stubs = new Stubs();
    searchReleasedUserObjects(query: LearningObjectQuery, username: string): Promise<LearningObjectSummary[]> {
        return Promise.resolve(
            [this.stubs.learningObject].map(mapLearningObjectToSummary),
        );
    }
    searchAllUserObjects(query: UserLearningObjectSearchQuery, username: string, collectionRestrictions?: CollectionAccessMap): Promise<LearningObjectSummary[]> {
        return Promise.resolve(
            [this.stubs.learningObject].map(mapLearningObjectToSummary),
        );
    }
}
