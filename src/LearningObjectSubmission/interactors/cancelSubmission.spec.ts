import { cancelSubmission } from './cancelSubmission';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';
import { SubmissionPublisher } from './SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { Stubs } from '../../tests/stubs';
import { MockLibraryDriver } from '../../tests/mock-drivers/MockLibraryDriver';
import { FileMetadata } from '../../FileMetadata';
import { FileMetaDatastore, LearningObjectGateway } from '../../FileMetadata/interfaces';
import { MockFileMetaDatastore, MockLearningObjectGateway } from '../../FileMetadata/mocks';

const stubs = new Stubs();
const dataStore = new MockDataStore();
const library = new MockLibraryDriver();
const publisher: SubmissionPublisher = {
  withdrawlSubmission: (id: string) => {
    return Promise.resolve();
  },
  publishSubmission: (submission: LearningObject) => null,
};

LearningObjectAdapter.open(dataStore, null, library);

describe('cancelSubmission', () => {
  beforeAll(() => {
    // FIXME: Module should not need to be initialized here, instead, the LearningObjectAdapter's interactor methods should resolve it instead of directly importing
    // Or LearningObjectAdapter should be mocked
    FileMetadata.providers = [
      { provide: FileMetaDatastore, useClass: MockFileMetaDatastore },
      { provide: LearningObjectGateway, useClass: MockLearningObjectGateway },
    ];
    FileMetadata.initialize();
  });

  afterAll(() => {
    FileMetadata.destroy();
  });
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
