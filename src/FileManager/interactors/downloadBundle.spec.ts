import { UserToken, LearningObjectSummary } from '../../shared/types';
import { FileManagerModule } from '../FileManagerModule';
import { LearningObjectGateway } from '../interfaces';
import { LearningObjectFilter } from '../../LearningObjects/typings';
import { LearningObject } from '../../shared/entity';
import { downloadBundle } from './downloadBundle';

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
class LearningObjectGatewayStub implements LearningObjectGateway {
    getWorkingLearningObjectSummary(params: { requester: UserToken; id: string; }): Promise<LearningObjectSummary> {
        throw new Error('Method not implemented.');
    }
    getReleasedLearningObjectSummary(id: string): Promise<LearningObjectSummary> {
        throw new Error('Method not implemented.');
    }
    getActiveLearningObjectSummary(params: { requester: UserToken; id: string; }): Promise<LearningObjectSummary> {
        throw new Error('Method not implemented.');
    }
    getLearningObjectById(params: { learningObjectId: string; requester?: UserToken; filter?: LearningObjectFilter; }): Promise<LearningObject> {
        return Promise.resolve({} as LearningObject);
    }
    getLearningObjectByName(params: { username: string; learningObjectName: string; requester: UserToken; revision: boolean; }): Promise<LearningObject> {
        throw new Error('Method not implemented.');
    }
}
describe('When downloadBundle is called', () => {
    describe('and the requester provided the ID of an existing Learning Object', () => {
        it('should not invoke getLearningObjectByName', () => {
          FileManagerModule.providers = [
            { provide: LearningObjectGateway, useClass: LearningObjectGatewayStub },
          ];
          FileManagerModule.initialize();
          const learningObjectGateway = FileManagerModule.resolveDependency(LearningObjectGateway);
          const spy = jest.spyOn(learningObjectGateway, 'getLearningObjectByName');
          downloadBundle(downloadBundleParamStub);
          expect(spy).not.toHaveBeenCalled();
        });
    });
    /* describe('and the requester provided the name of the Learning Object', () => {
        it('should invoke getLearningObjectByName', () => {

        });
    });
    describe('and the getLearningObjectById throws an error that is not NOT_FOUND', () => {
        it('should throw the error', () => {

        });
    }); */
});
