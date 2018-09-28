import { LearningObjectInteractor } from '../interactors/interactors';
import { expect } from 'chai';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockS3Driver } from '../tests/mock-drivers/MockS3Driver';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import { MOCK_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../interfaces/interfaces';
const driver: DataStore = new MockDataStore; // DataStore
const fileManager: FileManager = new MockS3Driver(); // FileManager
const library: LibraryCommunicator = new MockLibraryDriver();

describe('loadLearningObjectSummary', () => {
  it('should load learning object summary', done => {
    return LearningObjectInteractor.loadLearningObjectSummary(
      driver,
      library,
      MOCK_OBJECTS.USERNAME,
    ).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('loadLearningObject', () => {
  // it('should load learning object', done => {
  //   return LearningObjectInteractor.loadLearningObject(
  //     driver,
  //     library,
  //     MOCK_OBJECTS.USERNAME,
  //     MOCK_OBJECTS.LEARNING_OBJECT_NAME,
  //   ).then(val => {
  //     console.log(val);
  //     expect(val).to.be.an('object');
  //     done();
  //   }).catch((error) => {
  //     console.log(error);
  //     expect.fail();
  //     done();
  //   });
  // });
  // it('should return error - requesting unpublished object', done => {
  //   return LearningObjectInteractor.loadLearningObject(
  //     driver,
  //     library,
  //     MOCK_OBJECTS.USERNAME,
  //     MOCK_OBJECTS.LEARNING_OBJECT_NAME,
  //   ).then(val => {
  //     expect.fail();
  //     done();
  //   }).catch((error) => {
  //     expect(error).to.be.a('string');
  //     done();
  //   });
  // });
  // it('should return error - incorrect user', done => {
  //   return LearningObjectInteractor.loadLearningObject(
  //     driver,
  //     library,
  //     MOCK_OBJECTS.EMPTY_STRING,
  //     MOCK_OBJECTS.LEARNING_OBJECT_NAME,
  //   ).then(val => {
  //     expect.fail();
  //     done();
  //   }).catch((error) => {
  //     expect(error).to.be.a('string');
  //     done();
  //   });
  // });
});

describe('loadFullLearningObjectByIDs', () => {
  it('should load full learning object', done => {
    return LearningObjectInteractor.loadFullLearningObjectByIDs(
      driver,
      library,
      [MOCK_OBJECTS.LEARNING_OBJECT_ID],
    ).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
  it('should return learning object - given empty array!', done => {
    return LearningObjectInteractor.loadFullLearningObjectByIDs(
      driver,
      library,
      [MOCK_OBJECTS.EMPTY_STRING],
    ).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('addLearningObject', () => {
  // it('should return an error - we are trying to publish an object that already exists!', done => {
  //   LearningObjectInteractor.loadLearningObject(
  //     driver,
  //     library,
  //     MOCK_OBJECTS.USERNAME,
  //     MOCK_OBJECTS.LEARNING_OBJECT_NAME,
  //   ).then(val => {
  //     return LearningObjectInteractor.addLearningObject(
  //       driver,
  //       fileManager,
  //       val,
  //     // tslint:disable-next-line:no-shadowed-variable
  //     ).then(val => {
  //       console.log(val);
  //       expect.fail();
  //       done();
  //     }).catch ((error) => {
  //       expect(error).to.be.a('string');
  //       done();
  //     });
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
});

describe('findLearningObject', () => {
  it('should find a learning object ID', done => {
    return LearningObjectInteractor.findLearningObject(
      driver,
      MOCK_OBJECTS.USERNAME,
      MOCK_OBJECTS.LEARNING_OBJECT_NAME,
    ).then(val => {
      expect(val).to.be.a('string');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('updateLearningObject', () => {
  // it('should return an object - undefined because no changes were made', done => {
  //   LearningObjectInteractor.loadLearningObject(
  //     driver,
  //     library,
  //     MOCK_OBJECTS.USERNAME,
  //     MOCK_OBJECTS.LEARNING_OBJECT_NAME,
  //   ).then(val => {
  //     return LearningObjectInteractor.updateLearningObject(
  //       driver,
  //       fileManager,
  //       MOCK_OBJECTS.LEARNING_OBJECT_ID,
  //       val,
  //     // tslint:disable-next-line:no-shadowed-variable
  //     ).then(val => {
  //       expect(val).to.be.an('undefined');
  //       done();
  //     }).catch ((error) => {
  //       expect.fail();
  //       done();
  //     });
  //   }).catch((error) => {
  //     expect.fail();
  //     done();
  //   });
  // });
});

describe('togglePublished', () => {
  it('should return error', done => {
    return LearningObjectInteractor.togglePublished(
      driver,
      MOCK_OBJECTS.USERNAME,
      MOCK_OBJECTS.EMPTY_STRING,
      true,
    ).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
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
    ).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
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
    ).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
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
    ).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
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
    ).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('fetchObjectsByIDs', () => {
  it('should return an array of objects - based on given IDs', done => {
    return LearningObjectInteractor.fetchObjectsByIDs(
      driver,
      library,
      [MOCK_OBJECTS.LEARNING_OBJECT_ID],
    ).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('fetchCollections', () => {
  it('should return an array of objects - these objects contain lo IDs', done => {
    return LearningObjectInteractor.fetchCollections(driver).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('fetchCollection', () => {
  it('should return an object - contains an array of learning objects ', done => {
    return LearningObjectInteractor.fetchCollection(
      driver,
      MOCK_OBJECTS.COLLECTION_NAME,
    ).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});










