import { cancelSubmission } from './SubmissionInteractor';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { LearningObjectAdapter } from '../LearningObjects/LearningObjectAdapter';
import { Stubs } from '../stubs';

const dataStore = new MockDataStore();
const stubs = new Stubs();
LearningObjectAdapter.open(dataStore, null);

describe('cancelSubmission', () => {
  it('should cancel the submission given a valid username and id', async done => {
    await expect(
      cancelSubmission({
        dataStore,
        userId: stubs.learningObject.author.id,
        emailVerified: true,
        learningObjectId: stubs.learningObject.id,
      }),
    ).resolves.toBe(undefined);
    done();
  });
});


