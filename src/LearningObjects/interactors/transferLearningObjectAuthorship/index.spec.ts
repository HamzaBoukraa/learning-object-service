import { transferLearningObjectOwnership } from './index';
import { LearningObject } from '../../../shared/entity';
import { ERROR_MESSAGES } from './errors';

const stubRequester = {
    username: 'test_username',
    name: 'test_name',
    email: 'test_email',
    organization: 'test_organization',
    emailVerified: true,
    accessGroups: [''],
};

describe('When transferLearningObjectOwnership is called', () => {
    describe('and the requester is an admin', () => {
        it('should return a Learning Object', async () => {
            const stubParams = {
                learningObjectID: '',
                requester: { ...stubRequester, accessGroups: ['admin'] },
            };
            await expect(transferLearningObjectOwnership(stubParams))
                .resolves.toBeInstanceOf(Object);
        });
    });
    describe('and the requester is an editor', () => {
        it('should return a Learning Object', async () => {
            const stubParams = {
                learningObjectID: '',
                requester: { ...stubRequester, accessGroups: ['editor'] },
            };
            await expect(transferLearningObjectOwnership(stubParams))
                .resolves.toBeInstanceOf(Object);
        });
    });
    describe('and the requester is a curator@nccp', () => {
        it('should throw a forbidden error', async () => {
            const stubParams = {
                learningObjectID: '',
                requester: { ...stubRequester, accessGroups: ['curator@c5'] },
            };
            await expect(transferLearningObjectOwnership(stubParams))
                .rejects.toThrowError(ERROR_MESSAGES.FORBIDDEN);
        });
    });
    describe('and the requester is a reviewer@nccp', () => {
        it('should throw a forbidden error', async () => {
            const stubParams = {
                learningObjectID: '',
                requester: { ...stubRequester, accessGroups: ['reviewer@c5'] },
            };
            await expect(transferLearningObjectOwnership(stubParams))
                .rejects.toThrowError(ERROR_MESSAGES.FORBIDDEN);
        });
    });
    describe('and the requester does not have any privilege', () => {
        it('should throw a forbidden error', async () => {
            const stubParams = {
                learningObjectID: '',
                requester: { ...stubRequester, accessGroups: [''] },
            };
            await expect(transferLearningObjectOwnership(stubParams))
                .rejects.toThrowError(ERROR_MESSAGES.FORBIDDEN);
        });
    });
});
