import { cancelSubmission } from './cancelSubmission';
import {
  MOCK_OBJECTS,
  SUBMITTABLE_LEARNING_OBJECT,
} from '../../tests/mocks';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { DataStore } from '../../shared/interfaces/DataStore';
import { SubmissionDataStore } from '../SubmissionDatastore';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';

const dataStore = new MockDataStore();
LearningObjectAdapter.open(dataStore, null);

describe('cancelSubmission', () => {
  it('should cancel the submission given a valid username and id', async done => {
    await expect(
      cancelSubmission({
        dataStore,
        userId: MOCK_OBJECTS.AUTHOR_MOCK._id,
        emailVerified: true,
        learningObjectId: SUBMITTABLE_LEARNING_OBJECT.id,
      }),
    ).resolves.toBe(undefined);
    done();
  });
});


