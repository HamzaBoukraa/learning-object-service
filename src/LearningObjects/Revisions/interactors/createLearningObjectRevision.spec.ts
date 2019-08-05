import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
import { DataStore } from '../../../shared/interfaces/DataStore';
import { MockDataStore } from '../../../tests/mock-drivers/MockDataStore';
import { Stubs } from '../../../tests/stubs';
import { ERROR_MESSAGES } from './createLearningObjectRevision';
import { LearningObject } from '../../../shared/entity';

describe('createLearningObjectRevison', () => {
  const dataStore: DataStore = new MockDataStore();
  const stubs = new Stubs();
  const learningObject = stubs.learningObject;

  beforeEach(() => jest.resetModules());

  describe('when an Editor makes a request to create a revision', () => {
    const editor = {
      username: 'editor',
      name: 'Eddy Tor',
      email: 'eddy@clark.center',
      organization: 'CLARK',
      emailVerified: true,
      accessGroups: ['editor'],
    };

    describe('and a revision already exists', () => {
      it('should throw an error with the UNRELEASED_EXISTS message', async () => {
        jest.doMock('./getLearningObjectRevision', () => {
          return {
            __esModule: true,
            getLearningObjectRevision: () =>
              Promise.resolve({
                ...learningObject,
                status: LearningObject.Status.UNRELEASED,
              }),
          };
        });
        const t = await import('./createLearningObjectRevision');
        const createRevisionPromise = t.createLearningObjectRevision({
          username: learningObject.author.username,
          learningObjectId: learningObject.id,
          dataStore,
          requester: editor,
        });
        await expect(createRevisionPromise).rejects.toEqual(
          new ResourceError(
            ERROR_MESSAGES.REVISIONS.UNRELEASED_EXISTS,
            ResourceErrorReason.FORBIDDEN,
          ),
        );
      });
      it('should throw an error with the SUBMISSION_EXISTS message', async () => {
        jest.doMock('./getLearningObjectRevision', () => {
          return {
            __esModule: true,
            getLearningObjectRevision: () =>
              Promise.resolve({
                ...learningObject,
                status: LearningObject.Status.WAITING,
              }),
          };
        });
        const t = await import('./createLearningObjectRevision');
        const createRevisionPromise = t.createLearningObjectRevision({
          username: learningObject.author.username,
          learningObjectId: learningObject.id,
          dataStore,
          requester: editor,
        });
        await expect(createRevisionPromise).rejects.toEqual(
          new ResourceError(
            ERROR_MESSAGES.REVISIONS.SUBMISSION_EXISTS,
            ResourceErrorReason.FORBIDDEN,
          ),
        );
      });
    });

    describe('and there is no revision', () => {
      it('should set the revision status to Proofing', async () => {
        jest.doMock('./getLearningObjectRevision', () => {
          return {
            __esModule: true,
            getLearningObjectRevision: () => {
              throw new ResourceError('', ResourceErrorReason.NOT_FOUND);
            },
          };
        });
        const t = await import('./createLearningObjectRevision');
        const spy = jest.spyOn(dataStore, 'editLearningObject');
        await t.createLearningObjectRevision({
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
  });
  describe('when an Author makes a request to create a revision', () => {
    const author = stubs.userToken;
    const spy = jest.spyOn(dataStore, 'editLearningObject');

    describe('and a revision already exists', () => {
      it('should throw a ResourceError with the Conflict reason', async () => {
        jest.doMock('./getLearningObjectRevision', () => {
          return {
            __esModule: true,
            getLearningObjectRevision: () =>
              Promise.resolve({
                ...learningObject,
                status: LearningObject.Status.UNRELEASED,
              }),
          };
        });
        const t = await import('./createLearningObjectRevision');
        const createRevisionPromise = t.createLearningObjectRevision({
          username: learningObject.author.username,
          learningObjectId: learningObject.id,
          dataStore,
          requester: author,
        });
        await expect(createRevisionPromise).rejects.toEqual(new ResourceError(
          ERROR_MESSAGES.REVISIONS.EXISTS,
          ResourceErrorReason.CONFLICT,
        ));
      });
    });

    describe('and there is no revision', () => {
      it('should set the revision status to Unreleased', async () => {
        jest.doMock('./getLearningObjectRevision', () => {
          return {
            __esModule: true,
            getLearningObjectRevision: () => {
              throw new ResourceError('', ResourceErrorReason.NOT_FOUND);
            },
          };
        });
        const t = await import('./createLearningObjectRevision');
        await t.createLearningObjectRevision({
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
});
