import { cancelSubmission } from './cancelSubmission';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { SubmissionPublisher } from './SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { MockLibraryDriver } from '../../tests/mock-drivers/MockLibraryDriver';
import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';


const dataStore = new MockDataStore();
const library = new MockLibraryDriver();
const publisher: SubmissionPublisher = {
  deleteSubmission: (id: string) => {
    return Promise.resolve();
  },
  publishSubmission: (submission: LearningObject) => null,
};

const learningObjectDataStore = new MockDataStore();
LearningObjectAdapter.open(learningObjectDataStore, library);

describe('cancelSubmission', () => {
  it('should cancel the submission given a valid username and id', async done => {
    learningObjectDataStore.stubs.learningObject.status =
      LearningObject.Status.WAITING;
    const spy = spyOn(publisher, 'deleteSubmission');
    await expect(
      cancelSubmission({
        dataStore,
        publisher,
        userId: learningObjectDataStore.stubs.learningObject.author.id,
        user: learningObjectDataStore.stubs.userToken,
        emailVerified: true,
        learningObjectId: learningObjectDataStore.stubs.learningObject.id,
      }),
    ).resolves.toBe(undefined);
    expect(spy).toHaveBeenCalled();
    done();
  });
});
