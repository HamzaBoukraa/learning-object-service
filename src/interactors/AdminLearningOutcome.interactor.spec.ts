import { LearningObjectInteractor, AdminLearningObjectInteractor } from '../interactors/interactors';
import  MongoDriver from '../drivers/MongoDriver';
// import { expect } from 'chai';
// import RouteResponder  from '../drivers/RouteResponder';
// import { expect } from 'chai';
const driver = new MongoDriver; // DataStore
// const responder = new RouteResponder; // Responder
beforeAll(done => {
    // Before running any tests, connect to database
     const dburi = process.env.CLARK_DB_URI_TEST;
    // .replace(
    //   /<DB_PASSWORD>/g,
    //   process.env.CLARK_DB_PWD,
    // )
    // .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
    // .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
     driver.connect(dburi).then(val => {
      console.log('connected to database');
      done();
    }).catch((error) => {
      console.log('failed to connect to database');
      done();
    });
  });

describe('fetchAllObjects', () => {
  it('should return an array of objects', done => {
      return AdminLearningObjectInteractor.fetchAllObjects(driver).then(val => {
        expect(val).toBeTruthy();
        done();
      }).catch((error) => {
        console.log(error);
        expect(true).toBe(false);
        done();
      });
  });
  it('should return an error - given invalid data store!', done => {
      return AdminLearningObjectInteractor.fetchAllObjects(this.driver).then(val => {
        expect(true).toBe(false);
        done();
      }).catch((error) => {
        expect(error).toBeTruthy();
        done();
      });
  });
});

// describe('searchObjects', () => {
//   it('should return an array of users', done => {
//       const query = { username: 'nvisal1' };
//       return AdminLearningObjectInteractor.searchObjects(driver, 'text').then(val => {
//         console.log(val);
//         expect(val).toBeTruthy();
//         done();
//       }).catch((error) => {
//         console.log(error);
//         done();
//       });
//   });
// });

// describe('togglePublished', () => {
//   it('should return an array of objects', done => {
//       return AdminLearningObjectInteractor.togglePublished(driver, username, id, published).then(val => {
//         console.log(val);
//         expect(val).toBeTruthy();
//         done();
//       }).catch((error) => {
//         console.log(error);
//         done();
//       });
//   });
// });

afterAll (() => {
    driver.disconnect();
    console.log('Disconnected from database');
  });
