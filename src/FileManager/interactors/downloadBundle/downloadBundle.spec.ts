import {
  UserToken,
  LearningObjectSummary,
  FileUpload,
} from '../../../shared/types';
import { FileManagerModule } from '../../FileManagerModule';
import { LearningObjectGateway } from '../../interfaces';
import { LearningObjectFilter } from '../../../LearningObjects/typings';
import {
  LearningObject,
  HierarchicalLearningObject,
} from '../../../shared/entity';
import { downloadBundle, DownloadBundleParams } from './downloadBundle';
import { ResourceErrorReason, ResourceError } from '../../../shared/errors';
import { Gateways } from '../shared/dependencies';
import { Stream } from 'stream';
import { HierarchyGateway } from '../../gateways/HierarchyGateway/ModuleHierarchyGateway';
import FileManagerModuleErrorMessages from '../shared/errors';
const requesterStub: UserToken = {
  username: 'test-username',
  name: 'test-name',
  email: 'test-email',
  organization: 'test-organization',
  emailVerified: true,
  accessGroups: [],
};

const downloadBundleParamStub: DownloadBundleParams = {
  requester: requesterStub,
  learningObjectAuthorUsername: 'unittest',
  learningObjectId: 'unittest',
  revision: true,
};

const LearningObjectStub = {
  author: {
    username: '',
  },
} as LearningObject;

class LearningObjectGatewayStub implements LearningObjectGateway {
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
  getLearningObjectByName(params: {
    username: string;
    learningObjectName: string;
    requester: UserToken;
    revision: boolean;
  }): Promise<LearningObject> {
    throw new Error('Method not implemented.');
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
    { provide: LearningObjectGateway, useClass: LearningObjectGatewayStub },
    { provide: HierarchyGateway, useClass: HierarchyGatewayStub },
  ];
  FileManagerModule.initialize();
}

jest.mock('../../../LearningObjects/Publishing/Bundler/Interactor', () => ({
  bundleLearningObject: ({
    learningObject,
  }: {
    learningObject: HierarchicalLearningObject;
  }) => {
    return new Stream();
  },
}));

jest.mock('./Interactor', () => ({
  uploadFile: ({
    authorUsername,
    learningObjectId,
    learningObjectRevisionId,
    file,
  }: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    file: FileUpload;
  }): Promise<void> => {
    console.log('Stub update file');
    return;
  },
}));

describe('When downloadBundle is called for a Working Copy', () => {
  beforeEach(() => {
    initializeServiceModuleFixtures();
  });
  afterEach(() => {
    FileManagerModule.destroy();
  });
  describe('and the requester has download privilege', () => {
    describe('and the requester provided the ID of an existing Learning Object', () => {
      const collection = 'test';
      let spy: jest.SpyInstance<Promise<LearningObject>>;
      let requestParams: DownloadBundleParams;
      let learningObjectGateway: LearningObjectGateway;
      beforeEach(() => {
        /* FIXME: LearningObjectGateway setup should only be done once for each of the
                 test specs below, however the call order of Jest hooks makes this difficult
              */
        learningObjectGateway = Gateways.learningObjectGateway();
        learningObjectGateway.getLearningObjectById = () =>
          Promise.resolve({
            ...LearningObjectStub,
            collection,
          } as LearningObject);
        spy = jest.spyOn(learningObjectGateway, 'getLearningObjectByName');
        requestParams = { ...downloadBundleParamStub };
      });
      afterEach(() => {
        spy = null;
      });
      it('should not invoke getLearningObjectByName when the requester is an admin', async () => {
        requestParams.requester.accessGroups = ['admin'];
        const adminPromise = downloadBundle(requestParams);
        await expect(adminPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).not.toHaveBeenCalled();
      });
      it('should not invoke getLearningObjectByName when the requester is an editor', async () => {
        requestParams.requester.accessGroups = ['editor'];
        const editorPromise = downloadBundle(requestParams);
        await expect(editorPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not invoke getLearningObjectByName when the requester is a curator', async () => {
        requestParams.requester.accessGroups = [`curator@${collection}`];
        const curatorPromise = downloadBundle(requestParams);
        await expect(curatorPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not invoke getLearningObjectByName when the requester is a reviewer', async () => {
        requestParams.requester.accessGroups = [`reviewer@${collection}`];
        const reviewerPromise = downloadBundle(requestParams);
        await expect(reviewerPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).not.toHaveBeenCalled();
      });

      it('should not invoke getLearningObjectByName when the requester is the author', async () => {
        requestParams.requester.username = requesterStub.username;
        const authorPromise = downloadBundle(requestParams);
        await expect(authorPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).not.toHaveBeenCalled();
      });
    });
    describe('and the requester provided the name of the Learning Object', () => {
      const collection = 'test';
      let spy: jest.SpyInstance<Promise<LearningObject>>;
      let requestParams: DownloadBundleParams;
      let learningObjectGateway: LearningObjectGateway;
      beforeEach(() => {
        learningObjectGateway = Gateways.learningObjectGateway();
        learningObjectGateway.getLearningObjectById = () =>
          Promise.reject(new ResourceError('', ResourceErrorReason.NOT_FOUND));
        learningObjectGateway.getLearningObjectByName = () =>
          Promise.resolve({
            ...LearningObjectStub,
            collection,
          } as LearningObject);
        spy = jest.spyOn(learningObjectGateway, 'getLearningObjectByName');
        requestParams = { ...downloadBundleParamStub };
      });
      afterEach(() => {
        spy = null;
      });
      it('should invoke getLearningObjectByName when the requester is an admin', async () => {
        requestParams.requester.accessGroups = ['admin'];
        const adminPromise = downloadBundle(requestParams);
        await expect(adminPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).toHaveBeenCalled();
      });

      it('should invoke getLearningObjectByName when the requester is an editor', async () => {
        requestParams.requester.accessGroups = ['editor'];
        const editorPromise = downloadBundle(requestParams);
        await expect(editorPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).toHaveBeenCalled();
      });

      it('should invoke getLearningObjectByName when the requester is a curator', async () => {
        requestParams.requester.accessGroups = [`curator@${collection}`];
        const curatorPromise = downloadBundle(requestParams);
        await expect(curatorPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).toHaveBeenCalled();
      });

      it('should invoke getLearningObjectByName when the requester is a reviewer', async () => {
        requestParams.requester.accessGroups = [`reviewer@${collection}`];
        const reviewerPromise = downloadBundle(requestParams);
        await expect(reviewerPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).toHaveBeenCalled();
      });

      it('should invoke getLearningObjectByName when the requester is the author', async () => {
        requestParams.requester.username = requesterStub.username;
        const authorPromise = downloadBundle(requestParams);
        await expect(authorPromise).resolves.toBeInstanceOf(Stream);

        expect(spy).toHaveBeenCalled();
      });
    });
    describe('and the getLearningObjectById throws an error that is not NOT_FOUND', () => {
      it('should throw the error', async () => {
        await expect(
          downloadBundle(downloadBundleParamStub),
        ).rejects.toThrowError();
      });
    });
  });
  describe('and the requester does not have download privilege', () => {
    describe('because the requester does not have any access groups and is not the Learning Object author', () => {
      it('should throw a forbidden error', async () => {
        const learningObjectGateway = Gateways.learningObjectGateway();
        learningObjectGateway.getLearningObjectById = () =>
          Promise.resolve(LearningObjectStub);

        const promise = downloadBundle(downloadBundleParamStub);

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

        const learningObjectGateway = Gateways.learningObjectGateway();
        learningObjectGateway.getLearningObjectById = () =>
          Promise.resolve({
            ...LearningObjectStub,
            collection: learningObjectCollection,
          } as LearningObject);

        const curatorRequestParams = { ...downloadBundleParamStub };
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
        const requesterCollection = 'requester';
        const learningObjectCollection = 'Learning Object';

        const learningObjectGateway = Gateways.learningObjectGateway();
        learningObjectGateway.getLearningObjectById = () =>
          Promise.resolve({
            ...LearningObjectStub,
            collection: learningObjectCollection,
          } as LearningObject);

        const reviewerRequestParams = { ...downloadBundleParamStub };
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
