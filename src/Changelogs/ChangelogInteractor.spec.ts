import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MOCK_OBJECTS } from '../tests/mocks';
import {
  getRecentChangelog, createChangelog,
} from './ChangelogInteractor';
import { LearningObject } from '@cyber4all/clark-entity';

const dataStore: DataStore = new MockDataStore(); // DataStore

describe('Interactor: ChangelogInteractor', () => {
  it('should get latest changelog for a learning object', async () => {
    try {
        return expect(getRecentChangelog(
            dataStore,
            MOCK_OBJECTS.LEARNING_OBJECT_ID,
        ))
        .resolves.toHaveProperty('learningObjectId', MOCK_OBJECTS.LEARNING_OBJECT_ID);
    } catch (error) {
      console.log(error);
    }
  });
});


describe('createChangelog', () => {
    it('should create a new changelog', async () => {
        try {
            return expect(createChangelog({
                dataStore,
                learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
                user: MOCK_OBJECTS.USERTOKEN,
                changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
            }))
            .resolves.toBe(undefined);
        } catch (error) {
            console.error(error);
        }
    });
});
