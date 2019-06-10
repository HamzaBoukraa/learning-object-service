import { cancelSubmission } from './cancelSubmission';
import {
  MOCK_OBJECTS,
  SUBMITTABLE_LEARNING_OBJECT,
} from '../../tests/mocks';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { DataStore } from '../../shared/interfaces/DataStore';
import { SubmissionDataStore } from '../SubmissionDatastore';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';
import { SubmissionPublisher } from './SubmissionPublisher';
import { LearningObject } from '../../shared/entity';

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
        userId: MOCK_OBJECTS.AUTHOR_MOCK._id,
        user: MOCK_OBJECTS.USERTOKEN,
        emailVerified: true,
        learningObjectId: SUBMITTABLE_LEARNING_OBJECT.id,
      }),
    ).resolves.toBe(undefined);
    expect(spy).toHaveBeenCalled();
    done();
  });
});


