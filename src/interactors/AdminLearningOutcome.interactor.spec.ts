import { AdminLearningObjectInteractor } from '../interactors/interactors';
import { expect } from 'chai';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MOCK_OBJECTS } from '../tests/mocks';
const driver = new MockDataStore(); // DataStore

describe('fetchAllObjects', () => {
  it('should return an array of objects', done => {
    return AdminLearningObjectInteractor.fetchAllObjects(driver, MOCK_OBJECTS.ACCESS_GROUPS)
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

describe('toggleLock', () => {
  it('should toggle the lock status', done => {
    return AdminLearningObjectInteractor.toggleLock(driver, MOCK_OBJECTS.LEARNING_OBJECT_ID, MOCK_OBJECTS.ACCESS_GROUPS)
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
