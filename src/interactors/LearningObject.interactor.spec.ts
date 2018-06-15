import { LearningObjectInteractor, AdminLearningObjectInteractor } from '../interactors/interactors';
import  MongoDriver from '../drivers/MongoDriver';
// const expect = require('chai').expect;
import { expect } from 'chai';
const driver = new MongoDriver; // DataStore

beforeAll(done => {
  // Before running any tests, connect to database
  const dburi = process.env.CLARK_DB_URI_DEV.replace(
    /<DB_PASSWORD>/g,
    process.env.CLARK_DB_PWD,
  )
  .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
  .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
  driver.connect(dburi).then(val => {
    console.log('connected to database');
    done();
  }).catch((error) => {
    console.log('failed to connect to database');
    done();
  });
});

describe('loadLearningObjectSummary', () => {
    // Test 1: Provide expected input
  it('should load learning object summary', done => {
      const username = 'nvisal1';
      return LearningObjectInteractor.loadLearningObjectSummary(driver, username ).then(val => {
        expect(val).to.be.an('array');
        done();
      }).catch((error) => {
        expect.fail();
        done();
      });
  });
    // Test 2: Provide expected input
  it('should return error - empty username given!', done => {
          const username = '';
          return LearningObjectInteractor.loadLearningObjectSummary(driver, username ).then(val => {
            expect.fail();
            done();
          }).catch((error) => {
            expect(error).to.be.a('string');
            done();
          });
      });
});

describe('loadLearningObject', () => {
    // Test 1: Provide expected input
  it('should load learning object', done => {
      const username = 'nvisal1';
      const learningObjectName = 'testing more contributors 2';
      return LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
        expect(val).to.be.an('object');
        done();
      }).catch((error) => {
        expect.fail();
        done();
      });
  });
    // Test 2: Provide expected input
  it('should return error - incorrect user', done => {
          const username = '';
          const learningObjectName = 'testing more contributors 2';
          return LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
            expect.fail();
            done();
          }).catch((error) => {
            expect(error).to.be.a('string');
            done();
          });
      });
});

describe('loadFullLearningObjectByIDs', () => {
    // Test 1: Provide expected input
  it('should load full learning object', done => {
      const ids = ['5b17ea3be3a1c4761f7f9463', '5b17ea3be3a1c4761f7f9463'];
      return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, ids ).then(val => {
        expect(val).to.be.an('array');
        done();
      }).catch((error) => {
        expect.fail();
        done();
      });
  });
    // Test 1: Provide expected input
  it('should return learning object - given empty array!', done => {
          const ids = [''];
          return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, ids ).then(val => {
            expect(val).to.be.an('array');
            done();
          }).catch((error) => {
            expect.fail();
            done();
          });
      });
});

describe('findLearningObject', () => {
    // Test 1: Provide expected input
  it('should find a learning object ID', done => {
      const username = 'nvisal1';
      const learningObjectName = 'testing more contributors 2';
      return LearningObjectInteractor.findLearningObject(driver, username, learningObjectName ).then(val => {
        expect(val).to.be.a('string');
        done();
      }).catch((error) => {
        expect.fail();
        done();
      });
  });
});

// // ** updateLearningObject **
// // params (dataStore: DataStore, currPage?: number, limit?: number)
// //   organization?: string;
// // success - returns an array of users
// // failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
// describe('updateLearningObject', () => {
//     // Test 1: Provide expected input
//   it('should return an array of objects', done => {
//     driver.connect(dburi).then(val => {
//       const username = 'nvisal1';
//       const learningObjectName = 'test object';
//       const learningObject =
//       return LearningObjectInteractor.updateLearningObject(driver, username, learningObjectName ).then(val => {
//         // expect(response.error).toEqual('Server error encounter.');
//         console.log(val);
//         expect(val).toBeTruthy();
//         done();
//       }).catch((error) => {
//         console.log(error);
//         done();
//       });
//     }).catch((error) => {
//       console.log(error);
//       done();
//     });
//   });
// });

describe('togglePublished', () => {
    // Test 1: Provide expected input
  it('should return error', done => {
      const username = 'nvisal1';
      const learningObjectName = 'testing more contributors 2';
      const id = '';
      const published = true;
      return LearningObjectInteractor.togglePublished(driver, username, id, published).then(val => {
        expect.fail();
        done();
      }).catch((error) => {
        expect(error).to.be.a('string');
        done();
      });
  });
});

describe('fetchAllObjects', () => {
    // Test 1: Provide expected input
  it('should fetch all objects', done => {
      const currPage = 1;
      const limit = 3;
      return LearningObjectInteractor.fetchAllObjects(driver, currPage, limit).then(val => {
        expect(val).to.be.an('object');
        done();
      }).catch((error) => {
        expect.fail();
        done();
      });
  });
});

describe('fetchMultipleObjects', () => {
    // Test 1: Provide expected input
  it('should return an array of objects - based on given username and lo name', done => {
      const ids = [{username: 'nvisal1', learningObjectName: 'testing more contributors 2'}];
      return LearningObjectInteractor.fetchMultipleObjects(driver, ids).then(val => {
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
      const ids = ['5b17ea3be3a1c4761f7f9463'];
      return LearningObjectInteractor.fetchObjectsByIDs(driver, ids).then(val => {
        expect(val).to.be.an('array');
        done();
      }).catch((error) => {
        expect.fail();
        done();
      });
  });
  it('should return an error - invalid data store provided!', done => {
    const ids = ['5b17ea3be3a1c4761f7f9463'];
    return LearningObjectInteractor.fetchObjectsByIDs(this.driver, ids).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
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
  it('should return an error - invalid data store provided!', done => {
    return LearningObjectInteractor.fetchCollections(this.driver).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
});
});

describe('fetchCollection', () => {
    // Test 1: Provide expected input
  it('should return an object - contains an array of learning objects - *** above logs caused from this test ***', done => {
      // Extra time for this test is required, will timeout otherwise!
      jest.setTimeout(10000);
      const collectionName = 'NSA NCCP';
      return LearningObjectInteractor.fetchCollection(driver, collectionName).then(val => {
        expect(val).to.be.an('object');
        done();
      }).catch((error) => {
        expect.fail();
        done();
      });
  });
  it('should return an error - invalid collection name', done => {
    const collectionName = '';
    return LearningObjectInteractor.fetchCollection(driver, collectionName).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

afterAll (() => {
    driver.disconnect();
    console.log('Disconnected from database');
});


