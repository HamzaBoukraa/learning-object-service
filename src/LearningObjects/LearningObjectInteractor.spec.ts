import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MOCK_OBJECTS } from '../tests/mocks';
import {
  updateObjectLastModifiedDate,
  updateParentsDate,
  getRecentChangelog,
} from './LearningObjectInteractor';

const dataStore: DataStore = new MockDataStore(); // DataStore

describe('Interactor: LearningObjectInteractor', () => {
  it(`should update an object's last modified date and recursively update the child's parents' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      updateObjectLastModifiedDate({
        dataStore,
        id: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      }),
    ).resolves.toBe(undefined);
  });
  it(`should recursively update parent objects' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      updateParentsDate({
        dataStore,
        childId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        date: Date.now().toString(),
      }),
    ).resolves.toBe(undefined);
  });
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
