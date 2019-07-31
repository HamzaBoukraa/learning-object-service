import { isTopLevelLearningObject, fetchParents } from './HierarchyInteractor';
import { Stubs } from '../../tests/stubs';
import { DataStore } from '../../shared/interfaces/DataStore';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { UserToken } from '../../shared/types';

const dataStore: DataStore = new MockDataStore();
const stubs = new Stubs();

describe('LearningObjecs Hierarchy: HierarchyInteractor', () => {
  describe('isTopLevelLearningObject', () => {
    it('should return false', async () => {
      await expect(
        isTopLevelLearningObject({
          dataStore,
          learningObjectID: stubs.learningObject.id,
        }),
      ).resolves.toBe(false);
    });
  });

  describe('fetchParents', () => {
    describe('when the Learning Object is released', () => {
      it('should return released parents of the type LearningObjectSummary', async () => {
        const spy = jest.spyOn(dataStore, 'fetchReleasedParentObjects');
        const learningObjectID = stubs.learningObject.id;
        const userToken = {
          username: 'nottheauthor',
          accessGroups: [] as string[],
        };
        await fetchParents({
          dataStore,
          learningObjectID,
          userToken: userToken as UserToken,
        });
        expect(spy).toHaveBeenCalled();
      });
    });
    describe('when the requestor is the Author', () => {
      it('should return parents across every Learning Object status', async () => {
        const spy = jest.spyOn(dataStore, 'fetchParentObjects');
        const learningObjectID = stubs.learningObject.id;
        const userToken = {
          username: stubs.learningObject.author.username,
          accessGroups: [] as string[],
        };
        await fetchParents({
          dataStore,
          learningObjectID,
          userToken: userToken as UserToken,
        });
        expect(spy).toHaveBeenCalled();
      });
    });
  });
});
