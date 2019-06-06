import { DataStore } from '../shared/interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import {
  updateObjectLastModifiedDate,
  updateParentsDate,
  getLearningObjectChildrenById,
} from './LearningObjectInteractor';
import { Stubs } from '../stubs';

const dataStore: DataStore = new MockDataStore();
const stubs = new Stubs();

describe('Interactor: LearningObjectInteractor', () => {
  it(`should update an object's last modified date and recursively update the child's parents' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      updateObjectLastModifiedDate({
        dataStore,
        id: stubs.learningObject.id,
      }),
    ).resolves.toBe(undefined);
  });
  it(`should recursively update parent objects' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      updateParentsDate({
        dataStore,
        childId: stubs.learningObject.id,
        date: Date.now().toString(),
      }),
    ).resolves.toBe(undefined);
  });
  it(`should get object's children`, async () => {
    expect.assertions(1);
    await expect(
      getLearningObjectChildrenById(
        dataStore,
        stubs.learningObject.id,
      ),
    ). resolves.toEqual([]);
  });
});
