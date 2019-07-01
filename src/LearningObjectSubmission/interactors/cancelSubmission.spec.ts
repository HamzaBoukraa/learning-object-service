import { cancelSubmission } from './cancelSubmission';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';
import { SubmissionPublisher } from './SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { Stubs } from '../../tests/stubs';
import { MockLibraryDriver } from '../../tests/mock-drivers/MockLibraryDriver';

const stubs = new Stubs();
const dataStore = new MockDataStore();
const library = new MockLibraryDriver()
const publisher: SubmissionPublisher = {
  withdrawlSubmission: (id: string) => { return Promise.resolve(); },
  publishSubmission: (submission: LearningObject) => null,
};
LearningObjectAdapter.open(dataStore, null, library);

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


