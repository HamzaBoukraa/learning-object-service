import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MOCK_OBJECTS } from '../tests/mocks';
import {
  getRecentChangelog, createChangelog,
} from './ChangelogInteractor';

const dataStore: DataStore = new MockDataStore(); // DataStore

describe('getRecentChangelog', () => {
  it('should get latest changelog for a learning object', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: MOCK_OBJECTS.USER_ID,
        user: MOCK_OBJECTS.USERTOKEN,
    }))
    .resolves.toHaveProperty('learningObjectId', MOCK_OBJECTS.LEARNING_OBJECT_ID);
  });
});


describe('createChangelog', () => {
    it('should create a new changelog', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .resolves.toBe(undefined);
    });
});
