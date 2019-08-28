import { UserToken, LearningObjectSummary } from '../../shared/types';
import { FileManagerModule } from '../FileManagerModule';
import { LearningObjectGateway } from '../interfaces';
import { LearningObjectFilter } from '../../LearningObjects/typings';
import { LearningObject } from '../../shared/entity';
import { downloadBundle } from './downloadBundle';
import { ResourceErrorReason, ResourceError } from '../../shared/errors';
import { Gateways } from './shared/dependencies';

const requesterStub: UserToken = {
  username: 'test-username',
  name: 'test-name',
  email: 'test-email',
  organization: 'test-organization',
  emailVerified: true,
  accessGroups: [],
};

const downloadBundleParamStub = {
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
  getWorkingLearningObjectSummary(params: {
    requester: UserToken;
    id: string;
  }): Promise<LearningObjectSummary> {
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
  getLearningObjectByName(params: {
    username: string;
    learningObjectName: string;
    requester: UserToken;
    revision: boolean;
  }): Promise<LearningObject> {
    throw new Error('Method not implemented.');
  }
}

function initializeServiceModuleFixtures() {
  FileManagerModule.providers = [
    { provide: LearningObjectGateway, useClass: LearningObjectGatewayStub },
  ];
  FileManagerModule.initialize();
}
describe('When downloadBundle is called for a Working Copy', () => {
  beforeEach(() => {
    initializeServiceModuleFixtures();
  });
  afterEach(() => {
    FileManagerModule.destroy();
  });
  describe('and the requester has download privilege', () => {
    describe('and the requester provided the ID of an existing Learning Object', () => {
      it('should not invoke getLearningObjectByName', async () => {
        const learningObjectGateway = Gateways.learningObjectGateway();
        const collection = 'test';
        learningObjectGateway.getLearningObjectById = () =>
          Promise.resolve({ ...LearningObjectStub, collection } as LearningObject);
        const spy = jest.spyOn(
          learningObjectGateway,
          'getLearningObjectByName',
        );
        const adminRequestParams = { ...downloadBundleParamStub };
        adminRequestParams.requester.accessGroups = ['admin'];
        const adminPromise = downloadBundle(adminRequestParams);
        await expect(adminPromise).resolves.toBeUndefined();

        const editorRequestParams = { ...downloadBundleParamStub };
        editorRequestParams.requester.accessGroups = ['editor'];
        const editorPromise = downloadBundle(editorRequestParams);
        await expect(editorPromise).resolves.toBeUndefined();

        const curatorRequestParams = { ...downloadBundleParamStub };
        curatorRequestParams.requester.accessGroups = [`curator@${collection}`];
        const curatorPromise = downloadBundle(curatorRequestParams);
        await expect(curatorPromise).resolves.toBeUndefined();

        const reviewerRequestParams = { ...downloadBundleParamStub };
        reviewerRequestParams.requester.accessGroups = [`reviewer@${collection}`];
        const reviewerPromise = downloadBundle(curatorRequestParams);
        await expect(reviewerPromise).resolves.toBeUndefined();

        const authorRequestParams = { ...downloadBundleParamStub };
        authorRequestParams.requester.username = requesterStub.username;
        const authorPromise = downloadBundle(authorRequestParams);
        await expect(authorPromise).resolves.toBeUndefined();

        expect(spy).not.toHaveBeenCalled();
      });
    });
    describe('and the requester provided the name of the Learning Object', () => {
      it('should invoke getLearningObjectByName', async () => {
        const learningObjectGateway = Gateways.learningObjectGateway();
        const collection = 'test';
        const error = new ResourceError('', ResourceErrorReason.NOT_FOUND);
        learningObjectGateway.getLearningObjectById = () =>
          Promise.reject(error);
        learningObjectGateway.getLearningObjectByName = () =>
          Promise.resolve({ ...LearningObjectStub, collection } as LearningObject);
        const spy = jest.spyOn(
          learningObjectGateway,
          'getLearningObjectByName',
        );

        const adminRequestParams = { ...downloadBundleParamStub };
        adminRequestParams.requester.accessGroups = ['admin'];
        const adminPromise = downloadBundle(adminRequestParams);
        await expect(adminPromise).resolves.toBeUndefined();

        const editorRequestParams = { ...downloadBundleParamStub };
        editorRequestParams.requester.accessGroups = ['editor'];
        const editorPromise = downloadBundle(editorRequestParams);
        await expect(editorPromise).resolves.toBeUndefined();

        const curatorRequestParams = { ...downloadBundleParamStub };
        curatorRequestParams.requester.accessGroups = [`curator@${collection}`];
        const curatorPromise = downloadBundle(curatorRequestParams);
        await expect(curatorPromise).resolves.toBeUndefined();

        const reviewerRequestParams = { ...downloadBundleParamStub };
        reviewerRequestParams.requester.accessGroups = [`reviewer@${collection}`];
        const reviewerPromise = downloadBundle(curatorRequestParams);
        await expect(reviewerPromise).resolves.toBeUndefined();

        const authorRequestParams = { ...downloadBundleParamStub };
        authorRequestParams.requester.username = requesterStub.username;
        const authorPromise = downloadBundle(authorRequestParams);
        await expect(authorPromise).resolves.toBeUndefined();

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
        it('should thrown a forbidden error', async () => {
            const learningObjectGateway = Gateways.learningObjectGateway();
            learningObjectGateway.getLearningObjectById = () =>
                Promise.resolve(LearningObjectStub);

            const promise = downloadBundle(downloadBundleParamStub);

            await expect(promise).rejects.toThrowError(
                'User test-username does not have access to download the requested Learning Object',
            );
        });
    });
    describe('because the requester is a curator of another collection', () => {
        it('should throw a forbidden error', async () => {
            const requesterCollection = 'requester';
            const learningObjectCollection = 'Learning Object';

            const learningObjectGateway = Gateways.learningObjectGateway();
            learningObjectGateway.getLearningObjectById = () =>
                Promise.resolve({ ...LearningObjectStub, collection: learningObjectCollection } as LearningObject);

            const curatorRequestParams = { ...downloadBundleParamStub };
            curatorRequestParams.requester.accessGroups = [`curator@${requesterCollection}`];

            const promise = downloadBundle(curatorRequestParams);

            await expect(promise).rejects.toThrowError(
                'User test-username does not have access to download the requested Learning Object',
            );
        });
    });
    describe('because the requester is a reviewer of another collection', () => {
        it('should throw a forbidden error', async () => {
            const requesterCollection = 'requester';
            const learningObjectCollection = 'Learning Object';

            const learningObjectGateway = Gateways.learningObjectGateway();
            learningObjectGateway.getLearningObjectById = () =>
                Promise.resolve({ ...LearningObjectStub, collection: learningObjectCollection } as LearningObject);

            const reviewerRequestParams = { ...downloadBundleParamStub };
            reviewerRequestParams.requester.accessGroups = [`reviewer@${requesterCollection}`];

            const promise = downloadBundle(reviewerRequestParams);

            await expect(promise).rejects.toThrowError(
                'User test-username does not have access to download the requested Learning Object',
            );
        });
    });
  });
});
