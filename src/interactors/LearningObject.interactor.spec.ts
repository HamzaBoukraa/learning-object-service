import { LearningObjectInteractor } from '../interactors/interactors';
import { expect } from 'chai';
import { MOCK_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { LibraryCommunicator } from '../interfaces/interfaces';
import { UserToken } from '../types';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';

const dataStore: DataStore = new MockDataStore(); // DataStore
const library: LibraryCommunicator = new MockLibraryDriver();
const userToken: UserToken = {
  name: '',
  username: MOCK_OBJECTS.USERNAME,
  email: '',
  emailVerified: true,
  organization: '',
  accessGroups: [],
};
describe('loadUsersObjectSummaries', () => {
  it('should load learning object summary', done => {
    return LearningObjectInteractor.loadUsersObjectSummaries({
      dataStore,
      library,
      userToken: MOCK_OBJECTS.USERTOKEN,
      username: MOCK_OBJECTS.USERNAME,
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

describe('findLearningObject', () => {
  it('should find a learning object ID', done => {
    return LearningObjectInteractor.findLearningObject(
      dataStore,
      MOCK_OBJECTS.USERNAME,
      MOCK_OBJECTS.LEARNING_OBJECT_NAME,
    )
      .then(val => {
        expect(val).to.be.a('string');
        done();
      })
      .catch(error => {
        expect.fail();
        done();
      });
  });
});

describe('fetchAllObjects', () => {
  it('should fetch all objects', done => {
    return LearningObjectInteractor.fetchAllObjects(
      dataStore,
      library,
      MOCK_OBJECTS.CURR_PAGE,
      MOCK_OBJECTS.LIMIT,
    )
      .then(val => {
        expect(val).to.be.an('object');
        done();
      })
      .catch(error => {
        expect.fail();
        done();
      });
  });
  it('should return error - invalid currPage provided!', done => {
    let currPage;
    const limit = 3;
    return LearningObjectInteractor.fetchAllObjects(
      dataStore,
      library,
      currPage,
      limit,
    )
      .then(val => {
        expect.fail();
        done();
      })
      .catch(error => {
        expect(error).to.be.an('object');
        done();
      });
  });
  it('should return error - invalid limit provided!', done => {
    return LearningObjectInteractor.fetchAllObjects(
      dataStore,
      library,
      MOCK_OBJECTS.CURR_PAGE,
      MOCK_OBJECTS.NaN,
    )
      .then(val => {
        expect.fail();
        done();
      })
      .catch(error => {
        expect(error).to.be.an('object');
        done();
      });
  });
});
