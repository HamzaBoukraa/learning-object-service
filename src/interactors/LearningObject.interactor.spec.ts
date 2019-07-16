import { LearningObjectInteractor } from '../interactors/interactors';
import { DataStore } from '../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import { Stubs } from '../tests/stubs';

const dataStore: DataStore = new MockDataStore();
const library: LibraryCommunicator = new MockLibraryDriver();
const stubs = new Stubs();

describe('fetchObjectsByIDs', () => {
  it('should load full learning object', done => {
    return LearningObjectInteractor.fetchObjectsByIDs({
      dataStore,
      library,
      ids: [stubs.learningObject.id],
    }).then(val => {
      expect(val).toBeInstanceOf(Array);
      done();
    });
  });

  it('should return learning object - given empty array!', done => {
    return LearningObjectInteractor.fetchObjectsByIDs({
      dataStore,
      library,
      ids: [],
    }).then(val => {
      expect(val).toBeInstanceOf(Array);
      done();
    });
  });
});

describe('getLearningObjectId', () => {
  it('should find a learning object ID', done => {
    return LearningObjectInteractor.getLearningObjectId({
      dataStore,
      username: stubs.learningObject.author.username,
      learningObjectName: stubs.learningObject.name,
      userToken: stubs.userToken,
    }).then(val => {
      expect(val).toEqual(stubs.learningObject.id);
      done();
    });
  });
});
