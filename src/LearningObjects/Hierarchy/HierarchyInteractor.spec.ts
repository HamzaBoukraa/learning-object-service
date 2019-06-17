import { isTopLevelLearningObject } from './HierarchyInteractor';
import { Stubs } from '../../tests/stubs';
import { DataStore } from '../../shared/interfaces/DataStore';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';

const dataStore: DataStore = new MockDataStore();
const stubs = new Stubs();

describe('LearningObjecs Hierarchy: HierarchyInteractor', () => {

    describe('isTopLevelLearningObject', () => {
        it('should return false', async () => {
            await expect(isTopLevelLearningObject({
                dataStore,
                learningObjectID: stubs.learningObject.id,
            })).resolves.toBe(false);
        });
    });
});
