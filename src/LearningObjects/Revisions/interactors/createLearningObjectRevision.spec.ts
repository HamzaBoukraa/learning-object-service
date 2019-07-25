import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
jest.mock('./getLearningObjectRevision', () => ({
  getLearningObjectRevision: jest.fn(() => {
    throw new ResourceError('', ResourceErrorReason.NOT_FOUND);
  }),
}));
import { DataStore } from '../../../shared/interfaces/DataStore';
import { MockDataStore } from '../../../tests/mock-drivers/MockDataStore';
import { Stubs } from '../../../tests/stubs';
import { createLearningObjectRevision } from './createLearningObjectRevision';
import { LearningObject } from '../../../shared/entity';

describe('createLearningObjectRevison', () => {
  const dataStore: DataStore = new MockDataStore();
  const stubs = new Stubs();
  const learningObject = stubs.learningObject;

  describe('when an Editor makes a request to create a revision', () => {
    const editor = {
      username: 'editor',
      name: 'Eddy Tor',
      email: 'eddy@clark.center',
      organization: 'CLARK',
      emailVerified: true,
      accessGroups: ['editor'],
    };
    it('should set the revision status to Proofing', async () => {
      const spy = jest.spyOn(dataStore, 'editLearningObject');
      await createLearningObjectRevision({
        username: learningObject.author.username,
        learningObjectId: learningObject.id,
        dataStore,
        requester: editor,
      });
      expect(spy).toBeCalledWith({
        id: learningObject.id,
        updates: {
          status: LearningObject.Status.PROOFING,
          revision: learningObject.revision + 1,
        },
      });
    });
  });
  describe('when an Author makes a request to create a revision', () => {
    const author = stubs.userToken;
    const spy = jest.spyOn(dataStore, 'editLearningObject');
    it('should set the revision status to Unreleased', async () => {
      await createLearningObjectRevision({
        username: learningObject.author.username,
        learningObjectId: learningObject.id,
        dataStore,
        requester: author,
      });
      expect(spy).toBeCalledWith({
        id: learningObject.id,
        updates: {
          status: LearningObject.Status.UNRELEASED,
          revision: learningObject.revision + 1,
        },
      });
    });
  });
});
