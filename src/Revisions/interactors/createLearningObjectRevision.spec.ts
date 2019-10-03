import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { DataStore } from '../../shared/interfaces/DataStore';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { MockRevisionsDataStore } from '../../tests/mock-drivers/MockRevisionDataStore';
import { Stubs } from '../../tests/stubs';
import { ERROR_MESSAGES } from './createLearningObjectRevision';
import { LearningObject, HierarchicalLearningObject } from '../../shared/entity';
import { RevisionsDataStore } from '../RevisionsDataStore';
import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';
import { MockLibraryDriver } from '../../tests/mock-drivers/MockLibraryDriver';
import { FileManagerModule } from '../../FileManager/FileManagerModule';
import { HierarchyGateway } from '../../FileManager/gateways/HierarchyGateway/ModuleHierarchyGateway';
import { LearningObjectGateway } from '../../FileMetadata/interfaces';
import { LearningObjectFilter } from '../../LearningObjects/typings';
import { UserToken, LearningObjectSummary } from '../../shared/types';

const dataStore: DataStore = new MockDataStore();
const LibraryDriver = new MockLibraryDriver();
const revisionsDataStore: RevisionsDataStore = new MockRevisionsDataStore();
const stubs = new Stubs();
const learningObject = stubs.learningObject;
class LearningObjectGatewayStub implements LearningObjectGateway {
  async getReleasedLearningObjectSummary(id: string): Promise<LearningObjectSummary> {
    return await {} as LearningObjectSummary ;
  }
  async getLearningObjectSummary(params: { id: string; requester: UserToken; }): Promise<LearningObjectSummary> {
    return await {} as LearningObjectSummary ;
  }
  async updateObjectLastModifiedDate(id: string): Promise<void> {
    return;
  }
}

class HierarchyGatewayStub implements HierarchyGateway {
  async buildHierarchicalLearningObject(
    learningObject: LearningObject,
    requester: UserToken,
  ): Promise<HierarchicalLearningObject> {
    return (await {}) as HierarchicalLearningObject;
  }
}
jest.mock(
  '../../LearningObjects/adapters/LearningObjectAdapter',
  () => ({
    __esModule: true,
    LearningObjectAdapter: {
      getInstance: () => ({
        getLearningObjectByCuid: jest
          .fn()
          .mockResolvedValue([stubs.learningObject]),
      }),
    },
  }),
);
describe('createLearningObjectRevison', () => {
  beforeEach(() => {
    jest.resetModules();
    FileManagerModule.providers = [
      { provide: LearningObjectGateway, useClass: LearningObjectGatewayStub },
      { provide: HierarchyGateway, useClass: HierarchyGatewayStub },
    ];
    FileManagerModule.initialize();
  });

  afterEach(()=>{

    FileManagerModule.destroy();
    })

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
          cuid: learningObject.cuid,
          dataStore: revisionsDataStore,
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
          cuid: learningObject.cuid,
          dataStore: revisionsDataStore,
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
          cuid: learningObject.cuid,
          dataStore: revisionsDataStore,
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
          cuid: learningObject.cuid,
          dataStore: revisionsDataStore,
          requester: author,
        });
        await expect(createRevisionPromise).rejects.toEqual(
          new ResourceError(
            ERROR_MESSAGES.REVISIONS.EXISTS,
            ResourceErrorReason.CONFLICT,
          ),
        );
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
          cuid: learningObject.cuid,
          dataStore: revisionsDataStore,
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
