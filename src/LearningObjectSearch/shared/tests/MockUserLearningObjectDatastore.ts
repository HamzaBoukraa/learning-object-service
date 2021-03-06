import { UserLearningObjectDatastore } from '../../interfaces/UserLearningObjectDatastore';
import { LearningObjectQuery } from '../../../shared/interfaces/DataStore';
import {
  LearningObjectSummary,
  UserLearningObjectSearchQuery,
  CollectionAccessMap,
} from '../../../shared/types';
import { Stubs } from '../../../tests/stubs';
import { mapLearningObjectToSummary } from '../../../shared/functions';
import { LearningObject } from '../../typings';

export class MockUserLearningObjectDatastore
  implements UserLearningObjectDatastore {
  stubs = new Stubs();
  searchReleasedUserObjects(
    query: LearningObjectQuery,
    username: string,
  ): Promise<LearningObject[]> {
    return Promise.resolve([this.stubs.learningObject]);
  }
  searchAllUserObjects(
    query: UserLearningObjectSearchQuery,
    username: string,
    collectionRestrictions?: CollectionAccessMap,
  ): Promise<LearningObject[]> {
    return Promise.resolve([this.stubs.learningObject]);
  }
}
