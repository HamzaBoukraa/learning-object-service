import { AdminLearningObjectInteractor } from '../interactors/interactors';
import { expect } from 'chai';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MOCK_OBJECTS } from '../tests/mocks';
const driver = new MockDataStore(); // DataStore

describe('fetchAllObjects', () => {
  it('should return an array of objects', done => {
    return AdminLearningObjectInteractor.fetchAllObjects(driver)
      .then(val => {
        expect(val).to.be.an('object');
        done();
      })
      .catch(error => {
        console.log(error);
        expect.fail();
        done();
      });
  });
});

// describe('searchObjects', () => {
//   it('should return an array of users', done => {
//     const name = 'testing more contributors';
//     const author = 'nvisal1';
//     const length = ['nanomodule'];
//     const levels = ['undergraduate'];
//     const outcomeIDs = ['5b23cc9016bdb944d96f1b01'];
//     const text = 'testing more contributor';
//     const query = { username: 'nvisal1' };
//     return AdminLearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
//       expect(val).to.be.an('array');
//       done();
//     }).catch((error) => {
//       expect.fail();
//       done();
//     });
//   });
// });

// describe('togglePublished', () => {
//   it('should toggle the published status', done => {
//     const username = 'nvisal1';
//     const id = '5b23d22c87e4934e12547e31';
//     const published = false;
//     return AdminLearningObjectInteractor.togglePublished(driver, username, id, published).then(val => {
//       console.log(val);
//       expect(val).to.be.an('undefined');
//       done();
//     }).catch((error) => {
//       console.log(error);
//       expect.fail();
//       done();
//     });
//   });
// });

describe('toggleLock', () => {
  it('should toggle the lock status', done => {
    return AdminLearningObjectInteractor.toggleLock(driver, MOCK_OBJECTS.LEARNING_OBJECT_ID)
      .then(val => {
        expect(val).to.be.an('undefined');
        done();
      })
      .catch(error => {
        console.log(error);
        expect.fail();
        done();
      });
  });
});
