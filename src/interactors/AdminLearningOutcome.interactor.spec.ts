import { LearningObjectInteractor, AdminLearningObjectInteractor } from '../interactors/interactors';
import { MongoDriver } from '../drivers/MongoDriver';
import { expect } from 'chai';
const driver = new MongoDriver; // DataStore
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
    jest.setTimeout(10000);
    return AdminLearningObjectInteractor.fetchAllObjects(driver).then(val => {
      expect(val).to.be.an('object');
      done();
    }).catch((error) => {
      console.log(error);
      expect.fail();
      done();
    });
  });
  it('should return an error - given invalid data store!', done => {
    return AdminLearningObjectInteractor.fetchAllObjects(this.driver).then(val => {
      expect.fail();
      done();
    }).catch((error) => {
      expect(error).to.be.a('string');
      done();
    });
  });
});

describe('searchObjects', () => {
  it('should return an array of users', done => {
    const name = 'testing more contributors';
    const author = 'nvisal1';
    const length = ['nanomodule'];
    const levels = ['undergraduate'];
    const outcomeIDs = ['5b23cc9016bdb944d96f1b01'];
    const text = 'testing more contributor';
    const query = { username: 'nvisal1' };
    return AdminLearningObjectInteractor.searchObjects(driver, name, author, length, levels, outcomeIDs, text).then(val => {
      expect(val).to.be.an('array');
      done();
    }).catch((error) => {
      expect.fail();
      done();
    });
  });
});

describe('togglePublished', () => {
  it('should toggle the published status', done => {
    const username = 'nvisal1';
    const id = '5b23d22c87e4934e12547e31';
    const published = false;
    return AdminLearningObjectInteractor.togglePublished(driver, username, id, published).then(val => {
      expect(val).to.be.an('undefined');
      done();
    }).catch((error) => {
      console.log(error);
      expect.fail();
      done();
    });
  });
});

describe('toggleLock', () => {
    it('should toggle the lock status', done => {
      const id = '5b23d22c87e4934e12547e31';
      const published = false;
      return AdminLearningObjectInteractor.toggleLock(driver, id).then(val => {
        expect(val).to.be.an('undefined');
        done();
      }).catch((error) => {
        console.log(error);
        expect.fail();
        done();
      });
    });
  });

afterAll (() => {
    driver.disconnect();
    console.log('Disconnected from database');
  });
