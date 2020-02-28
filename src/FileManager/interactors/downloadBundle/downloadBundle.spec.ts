import {
  UserToken,
  LearningObjectSummary,
  FileUpload,
} from '../../../shared/types';
import { FileManagerModule } from '../../FileManagerModule';
import { LearningObjectGateway, FileManager } from '../../interfaces';
import { LearningObjectFilter } from '../../../LearningObjects/typings';
import {
  LearningObject,
  HierarchicalLearningObject,
  User,
} from '../../../shared/entity';
import { DownloadBundleParams } from './downloadBundle';
import { Gateways } from '../shared/dependencies';
import { Stream, Readable } from 'stream';
import { HierarchyGateway } from '../../gateways/HierarchyGateway/ModuleHierarchyGateway';
import FileManagerModuleErrorMessages from '../shared/errors';
import { Stubs } from '../../../tests/stubs';
import { UtilityUser } from '../../../shared/types/utility-users';


const requesterStub: UserToken = {
  username: 'test-username',
  name: 'test-name',
  email: 'test-email',
  organization: 'test-organization',
  emailVerified: true,
  accessGroups: [],
};
const stubs = new Stubs();
const downloadBundleParamStub: DownloadBundleParams = {
  requester: requesterStub,
  learningObject: stubs.learningObject,
};

const workingDownloadBundleParamStub: DownloadBundleParams = {
  requester: requesterStub,
  learningObject: new LearningObject({ name: 'test', author: new User({ username: 'test' }), status: 'waiting' }),
};

const LearningObjectStub = {
  author: {
    username: '',
  },
} as LearningObject;

const LearningObjectSummaryStub = {
  author: {
    username: '',
  },
} as LearningObjectSummary ;

class StubFileManager implements FileManager {
  upload(params: { authorUsername: string; learningObjectCUID: string; version: number; file: FileUpload; }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(params: { authorUsername: string; learningObjectCUID: string; version: number; path: string; }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteFolder(params: { authorUsername: string; learningObjectCUID: string; version: number; path: string; }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async streamFile(params: { authorUsername: string; learningObjectCUID: string; version: number; path: string; }): Promise<Readable> {
    return new Readable();
  }
  copyDirectory(params: { authorUsername: string; learningObjectCUID: string; version: number; newLearningObjectVersion: number; }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  async hasAccess(params: { authorUsername: string; learningObjectCUID: string; version: number; path: string; }): Promise<boolean> {
    return true;
  }
}


class UtilityDriver {
  getUtilityUsers(): Promise<UtilityUser[]> {
    throw new Error('Method not Implemented');
  }
}

class LearningObjectGatewayStub implements LearningObjectGateway {
  getLearningObjectByCuid(params: {
    username: string;
    cuid: string;
    version: number;
    requester: UserToken;
  }): Promise<LearningObjectSummary[]> {
    throw new Error('Method not implemented.');
  }
  getInternalLearningObjectByCuid(params: {
    username: string;
    cuid: string;
    version: number;
    requester: UserToken;
  }): Promise<LearningObject[]> {
    throw new Error('Method not implemented.');
  }
  getReleasedLearningObjectSummary(id: string): Promise<LearningObjectSummary> {
    throw new Error('Method not implemented.');
  }
  getActiveLearningObjectSummary(params: {
    requester: UserToken;
    id: string;
  }): Promise<LearningObjectSummary> {
    throw new Error('Method not implemented.');
  }
  getLearningObjectById(params: {
    learningObjectId: string;
    requester?: UserToken;
    filter?: LearningObjectFilter;
  }): Promise<LearningObject> {
    throw new Error('Method not implemented');
  }
  getLearningObjectSummary(): Promise<LearningObjectSummary> {
    throw new Error('Method not Implemented');
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

function initializeServiceModuleFixtures() {
  FileManagerModule.providers = [
    { provide: FileManager, useClass: StubFileManager },
    { provide: LearningObjectGateway, useClass: LearningObjectGatewayStub },
    { provide: HierarchyGateway, useClass: HierarchyGatewayStub },
  ];
  FileManagerModule.initialize();
}

function initializeMocks() {

  jest.mock('node-service-module', () => {
    return {
      ExpressServiceModule: class {
        public static resolveDependency() {
          return new StubFileManager();
        }
      },
      expressServiceModule: function() {
        return;
      },
      ServiceModule: class {
        public static resolveDependency() {
          return new StubFileManager();
        }
      },
      serviceModule: function() {
        return;
      },
    };
  });
  jest.mock('../../../shared/MongoDB/HelperFunctions/updateDownloads/updateDownloads', () => {
    return {
      updateDownloads (_: string, __: LearningObject): void { return; },
    };
  });
  jest.mock('../../../LearningObjects/Publishing/Bundler/Interactor', () => ({
    bundleLearningObject: ({
      learningObject,
    }: {
      learningObject: HierarchicalLearningObject;
    }) => {
      return new Stream();
    },
  }));

  jest.mock('../Interactor', () => ({
    uploadFile: (_: {
      authorUsername: string;
      learningObjectId: string;
      version: number;
      file: FileUpload;
    }): Promise<void> => {
      console.log('Stub update file');
      return;
    },
  }));

}


describe('When downloadBundle is called for a Working Copy', () => {
  beforeEach(async() => {
    jest.resetModules();
    initializeMocks();
    initializeServiceModuleFixtures();
  });
  afterEach(() => {
    FileManagerModule.destroy();
  });
  describe('and the requester has download privilege', () => {
    describe('and the requester provided the ID of an existing Learning Object', () => {
      const collection = 'test';
      let requestParams: DownloadBundleParams = { ...downloadBundleParamStub };

      it('should not invoke getLearningObjectByName when the requester is an admin', async () => {
        // ERRORS Cannot read property 'hasAccess' of undefined
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = ['admin'];
        const response = await downloadBundle(requestParams);
        expect(response).toBeInstanceOf(Stream);
      });
      it('should not invoke getLearningObjectByName when the requester is an editor', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = ['editor'];
        const editorPromise = downloadBundle(requestParams);
        await expect(editorPromise).resolves.toBeInstanceOf(Stream);
      });

      it('should not invoke getLearningObjectByName when the requester is a curator', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = [`curator@${collection}`];
        const curatorPromise = downloadBundle(requestParams);
        await expect(curatorPromise).resolves.toBeInstanceOf(Stream);
      });

      it('should not invoke getLearningObjectByName when the requester is a reviewer', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = [`reviewer@${collection}`];
        const reviewerPromise = downloadBundle(requestParams);
        await expect(reviewerPromise).resolves.toBeInstanceOf(Stream);
      });

      it('should not invoke getLearningObjectByName when the requester is the author', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.username = requesterStub.username;
        const authorPromise = downloadBundle(requestParams);
        await expect(authorPromise).resolves.toBeInstanceOf(Stream);
      });
    });
    describe('and the requester provided the name of the Learning Object', () => {
      const collection = 'test';
      let requestParams: DownloadBundleParams = { ...downloadBundleParamStub };

      it('should invoke getLearningObjectByName when the requester is an admin', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = ['admin'];
        const adminPromise = downloadBundle(requestParams);
        await expect(adminPromise).resolves.toBeInstanceOf(Stream);
      });

      it('should invoke getLearningObjectByName when the requester is an editor', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = ['editor'];
        const editorPromise = downloadBundle(requestParams);
        await expect(editorPromise).resolves.toBeInstanceOf(Stream);
      });

      it('should invoke getLearningObjectByName when the requester is a curator', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = [`curator@${collection}`];
        const curatorPromise = downloadBundle(requestParams);
        await expect(curatorPromise).resolves.toBeInstanceOf(Stream);
      });

      it('should invoke getLearningObjectByName when the requester is a reviewer', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.accessGroups = [`reviewer@${collection}`];
        const reviewerPromise = downloadBundle(requestParams);
        await expect(reviewerPromise).resolves.toBeInstanceOf(Stream);
      });

      it('should invoke getLearningObjectByName when the requester is the author', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        requestParams.requester.username = requesterStub.username;
        const authorPromise = downloadBundle(requestParams);
        await expect(authorPromise).resolves.toBeInstanceOf(Stream);
      });
    });
    describe('and the getLearningObjectById throws an error that is not NOT_FOUND', () => {
      it('should throw the error', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        await expect(
          downloadBundle(workingDownloadBundleParamStub),
        ).rejects.toThrowError();
      });
    });
  });
  describe('and the requester does not have download privilege', () => {
    describe('because the requester does not have any access groups and is not the Learning Object author', () => {
      it('should throw a forbidden error', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        const learningObjectGateway = Gateways.learningObjectGateway();
        learningObjectGateway.getLearningObjectById = () =>
          Promise.resolve(LearningObjectStub);

        const promise = downloadBundle(workingDownloadBundleParamStub);

        await expect(promise).rejects.toThrowError(
          FileManagerModuleErrorMessages.forbiddenLearningObjectDownload(
            'test-username',
          ),
        );
      });
    });
    describe('because the requester is a curator of another collection', () => {
      it('should throw a forbidden error', async () => {
        const requesterCollection = 'requester';
        const learningObjectCollection = 'Learning Object';

        const { downloadBundle } = await import('./downloadBundle');

        const learningObjectGateway = Gateways.learningObjectGateway();
        learningObjectGateway.getLearningObjectById = () =>
          Promise.resolve({
            ...LearningObjectStub,
            collection: learningObjectCollection,
          } as LearningObject);

        const curatorRequestParams = { ...workingDownloadBundleParamStub };
        curatorRequestParams.requester.accessGroups = [
          `curator@${requesterCollection}`,
        ];

        const promise = downloadBundle(curatorRequestParams);

        await expect(promise).rejects.toThrowError(
          FileManagerModuleErrorMessages.forbiddenLearningObjectDownload(
            'test-username',
          ),
        );
      });
    });
    describe('because the requester is a reviewer of another collection', () => {
      it('should throw a forbidden error', async () => {
        const { downloadBundle } = await import('./downloadBundle');
        const requesterCollection = 'requester';

        const reviewerRequestParams = { ...workingDownloadBundleParamStub };
        reviewerRequestParams.requester.accessGroups = [
          `reviewer@${requesterCollection}`,
        ];

        const promise = downloadBundle(reviewerRequestParams);

        await expect(promise).rejects.toThrowError(
          FileManagerModuleErrorMessages.forbiddenLearningObjectDownload(
            'test-username',
          ),
        );
      });
    });
  });
});
