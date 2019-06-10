import { cancelSubmission } from './cancelSubmission';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';
import { SubmissionPublisher } from './SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { Stubs } from '../../tests/stubs';

const stubs = new Stubs();
const dataStore = new MockDataStore();
const publisher: SubmissionPublisher = {
  withdrawlSubmission: (id: string) => { return Promise.resolve(); },
  publishSubmission: (submission: LearningObject) => null,
};
LearningObjectAdapter.open(dataStore, null);

describe('cancelSubmission', () => {
  it('should cancel the submission given a valid username and id', async done => {
    const spy = spyOn(publisher, 'withdrawlSubmission');
    await expect(
      cancelSubmission({
        dataStore,
        publisher,
        userId: stubs.learningObject.author.id,
        user: stubs.userToken,
        emailVerified: true,
        learningObjectId: stubs.learningObject.id,
      }),
    ).resolves.toBe(undefined);
    expect(spy).toHaveBeenCalled();
    done();
  });
});


