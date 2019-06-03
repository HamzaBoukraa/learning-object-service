import { LearningObjectInteractor } from '../interactors/interactors';
import { MOCK_OBJECTS } from '../tests/mocks';
import { DataStore } from '../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';

const dataStore: DataStore = new MockDataStore(); // DataStore
const library: LibraryCommunicator = new MockLibraryDriver();

describe('loadUsersObjectSummaries', () => {
  it('should load learning object summary', done => {
    return LearningObjectInteractor.loadUsersObjectSummaries({
      dataStore,
      library,
      userToken: MOCK_OBJECTS.USERTOKEN,
      username: MOCK_OBJECTS.USERTOKEN.username,
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      })
      .catch(error => {
        throw new Error('Failed to load summary.');
      });
  });
});

describe('loadProfile', () => {
  it('should return an array of learning object summaries', done => {
    return LearningObjectInteractor.loadProfile({
      dataStore,
      userToken: MOCK_OBJECTS.USERTOKEN,
      username: MOCK_OBJECTS.USERTOKEN.username,
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });

  it('should return an array of learning object summaries', done => {
    return LearningObjectInteractor.loadProfile({
      dataStore,
      userToken: undefined,
      username: MOCK_OBJECTS.USERTOKEN.username,
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });
});

describe('fetchObjectsByIDs', () => {
  it('should load full learning object', done => {
    return LearningObjectInteractor.fetchObjectsByIDs({
      dataStore,
      library,
      ids: [MOCK_OBJECTS.LEARNING_OBJECT_ID],
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });

  it('should return learning object - given empty array!', done => {
    return LearningObjectInteractor.fetchObjectsByIDs({
      dataStore,
      library,
      ids: [MOCK_OBJECTS.EMPTY_STRING],
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });
});

describe('getLearningObjectId', () => {
  it('should find a learning object ID', done => {
    return LearningObjectInteractor.getLearningObjectId({
      dataStore,
      username: MOCK_OBJECTS.USERNAME,
      learningObjectName: MOCK_OBJECTS.LEARNING_OBJECT_NAME,
      userToken: MOCK_OBJECTS.USERTOKEN,
    })
      .then(val => {
        expect(val).toEqual(MOCK_OBJECTS.LEARNING_OBJECT_ID);
        done();
      });
  });
});
