import { LearningObjectInteractor, AdminLearningObjectInteractor } from '../interactors/interactors';
import  MongoDriver from '../drivers/MongoDriver';
// import { expect } from 'chai';
// import RouteResponder  from '../drivers/RouteResponder';
// import { expect } from 'chai';
const driver = new MongoDriver; // DataStore
// const responder = new RouteResponder; // Responder
const dburi = process.env.CLARK_DB_URI_DEV.replace(
    /<DB_PASSWORD>/g,
    process.env.CLARK_DB_PWD,
  )
  .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
  .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);

// ** loadLearningObjectSummary **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('loadLearningObjectSummary', () => {
    // Test 1: Provide expected input
  it('should load learning object summary', done => {
    driver.connect(dburi).then(val => {
      const username = 'nvisal1';
      return LearningObjectInteractor.loadLearningObjectSummary(driver, username ).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        expect(true).toBe(false);
        done();
      });
    }).catch((error) => {
      expect(true).toBe(false);
      done();
    });
  });
    // Test 2: Provide expected input
  it('should return error - empty username given!', done => {
        driver.connect(dburi).then(val => {
          const username = '';
          return LearningObjectInteractor.loadLearningObjectSummary(driver, username ).then(val => {
            // expect(response.error).toEqual('Server error encounter.');
            expect(true).toBe(false);
            done();
          }).catch((error) => {
            expect(error).toBeTruthy();
            done();
          });
        }).catch((error) => {
          expect(true).toBe(false);
          done();
        });
      });
});

// ** loadLearningObject **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('loadLearningObject', () => {
    // Test 1: Provide expected input
  it('should load learning object - invalid access - throws error!', done => {
    driver.connect(dburi).then(val => {
      const username = 'nvisal1';
      const learningObjectName = 'test contributors';
      return LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(true).toBe(false);
        done();
      }).catch((error) => {
        console.log(error);
        expect(error).toBeTruthy();
        done();
      });
    }).catch((error) => {
      console.log(error);
      expect(true).toBe(false);
      done();
    });
  });
    // Test 2: Provide expected input
  it('should return error - incorrect user', done => {
        driver.connect(dburi).then(val => {
          const username = '';
          const learningObjectName = 'test contributors';
          return LearningObjectInteractor.loadLearningObject(driver, username, learningObjectName).then(val => {
            // expect(response.error).toEqual('Server error encounter.');
            expect(true).toBe(false);
            done();
          }).catch((error) => {
            console.log(error);
            expect(error).toBeTruthy();
            done();
          });
        }).catch((error) => {
          console.log(error);
          expect(true).toBe(false);
          done();
        });
      });
});

// ** loadFullLearningObjectByIDs **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('loadFullLearningObjectByIDs', () => {
    // Test 1: Provide expected input
  it('should load full learning object', done => {
    driver.connect(dburi).then(val => {
      const ids = ['5b17ea3be3a1c4761f7f9463', '5b17ea3be3a1c4761f7f9463'];
      return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, ids ).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        expect(true).toBe(false);
        done();
      });
    }).catch((error) => {
      console.log(error);
      expect(true).toBe(false);
      done();
    });
  });
    // Test 1: Provide expected input
  it('should return learning object - given empty array!', done => {
        driver.connect(dburi).then(val => {
          const ids = [''];
          return LearningObjectInteractor.loadFullLearningObjectByIDs(driver, ids ).then(val => {
            // expect(response.error).toEqual('Server error encounter.');
            expect(val).toBeTruthy();
            done();
          }).catch((error) => {
            console.log(error);
            expect(true).toBe(false);
            done();
          });
        }).catch((error) => {
          console.log(error);
          expect(true).toBe(false);
          done();
        });
      });
});

// ** findLearningObject **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('findLearningObject', () => {
    // Test 1: Provide expected input
  it('should find a learning object', done => {
    driver.connect(dburi).then(val => {
      const username = 'nvisal1';
      const learningObjectName = 'test contributors';
      return LearningObjectInteractor.findLearningObject(driver, username, learningObjectName ).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        done();
      });
    }).catch((error) => {
      console.log(error);
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

// ** togglePublished **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('togglePublished', () => {
    // Test 1: Provide expected input
  it('should toggle published status', done => {
    driver.connect(dburi).then(val => {
      const username = 'nvisal1';
      const learningObjectName = 'test contributors';
      const id = '5b17ea3be3a1c4761f7f9463';
      const published = true;
      return LearningObjectInteractor.togglePublished(driver, username, id, published).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        done();
      });
    }).catch((error) => {
      console.log(error);
      done();
    });
  });
});

// ** fetchAllObjects **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('fetchAllObjects', () => {
    // Test 1: Provide expected input
  it('should fetch all objects', done => {
    driver.connect(dburi).then(val => {
      const currPage = 1;
      const limit = 3;
      return LearningObjectInteractor.fetchAllObjects(driver, currPage, limit).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        done();
      });
    }).catch((error) => {
      console.log(error);
      done();
    });
  });
});

// ** fetchMultipleObjects **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('fetchMultipleObjects', () => {
    // Test 1: Provide expected input
  it('should fetch multiple learning objects', done => {
    driver.connect(dburi).then(val => {
      const ids = [{username: 'nvisal1', learningObjectName: 'test contributors'}];
      return LearningObjectInteractor.fetchMultipleObjects(driver, ids).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        done();
      });
    }).catch((error) => {
      console.log(error);
      done();
    });
  });
});

// ** fetchObjectsByIDs **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('fetchObjectsByIDs', () => {
    // Test 1: Provide expected input
  it('should fetch multiple learning objects', done => {
    driver.connect(dburi).then(val => {
      const ids = ['5b17ea3be3a1c4761f7f9463'];
      return LearningObjectInteractor.fetchObjectsByIDs(driver, ids).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        done();
      });
    }).catch((error) => {
      console.log(error);
      done();
    });
  });
});

// ** fetchCollections **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('fetchCollections', () => {
    // Test 1: Provide expected input
  it('should fetch multiple learning objects', done => {
    driver.connect(dburi).then(val => {
      return LearningObjectInteractor.fetchCollections(driver).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        done();
      });
    }).catch((error) => {
      console.log(error);
      done();
    });
  });
});

// ** fetchCollection **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('fetchCollection', () => {
    // Test 1: Provide expected input
  it('should fetch multiple learning objects', done => {
    driver.connect(dburi).then(val => {
      const name = 'test contributors';
      return LearningObjectInteractor.fetchCollection(driver, name).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        done();
      });
    }).catch((error) => {
      console.log(error);
      done();
    });
  });
});
