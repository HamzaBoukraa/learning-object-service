import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MOCK_OBJECTS } from '../tests/mocks';
import {
  getRecentChangelog, createChangelog,
} from './ChangelogInteractor';

const dataStore: DataStore = new MockDataStore(); // DataStore

describe('Interactor: ChangelogInteractor', () => {
  it('should get latest changelog for a learning object', async () => {
    try {
        await expect(getRecentChangelog(
            dataStore,
            MOCK_OBJECTS.LEARNING_OBJECT_ID,
        ))
        .resolves.toEqual({
            _id: '1234',
            learningObjectId: '1223',
            logs: [
                {
                    userId: '123',
                    date: '2019-02-06T15:52:10.894Z',
                    text: 'hello',
                },
            ],
        });
    } catch (error) {
      console.log(error);
    }
  });
});


describe('createChangelog', () => {
    it('should create a new changelog', async () => {
        try {
            await expect(createChangelog({
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
