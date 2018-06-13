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

// ** fetchAllObjects **
// params (dataStore: DataStore, currPage?: number, limit?: number)
//   organization?: string;
// success - returns an array of users
// failure - returns Promise.reject(`Problem searching users. Error: ${e}`);
describe('fetchAllObjects', () => {
    // Test 1: Provide expected input
  it('should return an array of objects', done => {
    driver.connect(dburi).then(val => {
      return AdminLearningObjectInteractor.fetchAllObjects(driver).then(val => {
        // expect(response.error).toEqual('Server error encounter.');
        console.log(val);
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

// describe('searchObjects', () => {
//     // Test 1: Provide expected input 
//   it('should return an array of users', done => {
//     driver.connect(dburi).then(val => {
//       const query = { username: 'nvisal1' };
//       return AdminLearningObjectInteractor.searchObjects(driver, 'text').then(val => {
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
// describe('togglePublished', () => {
//     // Test 1: Provide expected input
//   it('should return an array of objects', done => {
//     driver.connect(dburi).then(val => {
//       return AdminLearningObjectInteractor.togglePublished(driver, username, id, published).then(val => {
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
