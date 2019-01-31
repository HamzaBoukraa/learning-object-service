import { LearningObjectInteractor } from '../interactors/interactors';
import { expect } from 'chai';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import { MOCK_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { LibraryCommunicator } from '../interfaces/interfaces';

const driver: DataStore = new MockDataStore(); // DataStore
const library: LibraryCommunicator = new MockLibraryDriver();

const userToken = {
  username: MOCK_OBJECTS.USERNAME,
  name: '',
  email: '',
  organization: '',
  emailVerified: 'true',
  // @ts-ignore
  accessGroups: [],
};

describe('loadLearningObjectSummary', () => {
  it('should load learning object summary', done => {
    return LearningObjectInteractor.loadLearningObjectSummary({
      dataStore: driver,
      library,
      username: MOCK_OBJECTS.USERNAME,
      userToken,
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

describe('loadFullLearningObjectByIDs', () => {
  it('should load full learning object', done => {
    return LearningObjectInteractor.loadFullLearningObjectByIDs(
      driver,
      library,
      [MOCK_OBJECTS.LEARNING_OBJECT_ID],
    )
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
    return LearningObjectInteractor.loadFullLearningObjectByIDs(
      driver,
      library,
      [MOCK_OBJECTS.EMPTY_STRING],
    )
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
      driver,
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
      driver,
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
      driver,
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
      driver,
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

describe('fetchMultipleObjects', () => {
  it('should return an array of objects - based on given username and lo name', done => {
    const object = [
      {
        username: MOCK_OBJECTS.USERNAME,
        learningObjectName: MOCK_OBJECTS.LEARNING_OBJECT_NAME,
      },
    ];
    return LearningObjectInteractor.fetchMultipleObjects(
      driver,
      library,
      object,
    )
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
  it('should return an array of objects - based on given IDs', done => {
    return LearningObjectInteractor.fetchObjectsByIDs(driver, library, [
      MOCK_OBJECTS.LEARNING_OBJECT_ID,
    ])
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
