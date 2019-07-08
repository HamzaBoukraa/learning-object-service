import { cancelSubmission } from './cancelSubmission';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { SubmissionPublisher } from './SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { MockLibraryDriver } from '../../tests/mock-drivers/MockLibraryDriver';
import { FileMetadataModule } from '../../FileMetadata/FileMetadataModule';
import { FileMetaDatastore, LearningObjectGateway } from '../../FileMetadata/interfaces';
import { MockFileMetaDatastore, MockLearningObjectGateway } from '../../FileMetadata/mocks';
import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';

const dataStore = new MockDataStore();
const library = new MockLibraryDriver();
const publisher: SubmissionPublisher = {
  withdrawlSubmission: (id: string) => {
    return Promise.resolve();
  },
  publishSubmission: (submission: LearningObject) => null,
};

LearningObjectAdapter.open(dataStore, library);
const learningObjectDataStore = new MockDataStore();

describe('cancelSubmission', () => {
  beforeAll(() => {
    // FIXME: Module should not need to be initialized here, instead, the LearningObjectAdapter's interactor methods should resolve it instead of directly importing
    // Or LearningObjectAdapter should be mocked
    FileMetadataModule.providers = [
      { provide: FileMetaDatastore, useClass: MockFileMetaDatastore },
      { provide: LearningObjectGateway, useClass: MockLearningObjectGateway },
    ];
    FileMetadataModule.initialize();
  });

  afterAll(() => {
    FileMetadataModule.destroy();
  });
  it('should cancel the submission given a valid username and id', async done => {
    learningObjectDataStore.stubs.learningObject.status =
      LearningObject.Status.WAITING;
    const spy = spyOn(publisher, 'withdrawlSubmission');
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
