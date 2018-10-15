import { expect } from 'chai';
import { togglePublished as test } from './SubmissionInteractor';
import { MOCK_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

const dataStore: DataStore = new MockDataStore; // DataStore

describe('togglePublished', () => {
  it('should return error', done => {
    return test(
      dataStore,
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
