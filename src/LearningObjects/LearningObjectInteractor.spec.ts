
import { getRecentChangelog } from './LearningObjectInteractor';
import { MOCK_OBJECTS, SUBMITTABLE_LEARNING_OBJECT, INVALID_LEARNING_OBJECTS } from '../tests/mocks';
import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

const dataStore: DataStore = new MockDataStore; // DataStore

describe('getRecentChanglog', () => {
  it('should get latest changelog for a learning object', async done => {
    try {
      await expect(getRecentChangelog(
        dataStore,
        MOCK_OBJECTS.LEARNING_OBJECT_ID
      ))
      .resolves.toBe(undefined);
      done();
    } catch (error) {
      console.log(error);
    }
  });
});


