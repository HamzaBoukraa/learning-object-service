import { LearningObjectInteractor } from '../interactors/interactors';
import { expect } from 'chai';
import { MOCK_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { LibraryCommunicator } from '../interfaces/interfaces';
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
        expect(val).to.be.an('array');
        done();
      })
      .catch(error => {
        expect.fail();
        done();
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
        expect(val).to.be.an('array');
        done();
      })
      .catch(error => {
        expect.fail();
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
        expect(val).to.be.an('array');
        done();
      })
      .catch(error => {
        expect.fail();
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
        expect(val).to.be.an('array');
        done();
      })
      .catch(error => {
        expect.fail();
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
        expect(val).to.be.an('array');
        done();
      })
      .catch(error => {
        expect.fail();
        done();
      });
  });
});
