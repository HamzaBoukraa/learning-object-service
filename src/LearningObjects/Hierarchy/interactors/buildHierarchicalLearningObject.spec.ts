import { LearningObject } from '../../../shared/entity';
import { UserToken, LearningObjectSummary, AuthorSummary, LearningObjectChildSummary } from '../../../shared/types';
import { LearningObjectAdapter } from '../../adapters/LearningObjectAdapter';
import { MockDataStore } from '../../../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../../../tests/mock-drivers/MockLibraryDriver';
import { buildHierarchicalLearningObject } from './buildHierarchicalLearningObject';

const learningObjectChildSummaryStub: LearningObjectChildSummary = {
    id: 'test_id',
    author: {
      id: 'test_author-id',
      username: 'test_username',
      name: 'test_name',
      organization: 'test_organization',
    },
    collection: 'test_collection',
    contributors: [] as AuthorSummary[],
    date: 'test_date',
    description: 'test_description',
    length: 'test_length',
    name: 'test_name',
    status: 'test_status',
};

const fullLearningObjectStub = {
    name: 'test_learning-object',
    children: [],
} as LearningObject;

const requesterStub: UserToken = {
    username: 'test-username',
    name: 'test-name',
    email: 'test-email',
    organization: 'test-organization',
    emailVerified: true,
    accessGroups: [],
};

beforeAll(() => {
    jest.mock('../../adapters/LearningObjectAdapter', () => ({
        getLearningObjectById: jest
          .fn()
          .mockReturnValueOnce({ ...fullLearningObjectStub, children: [ learningObjectChildSummaryStub ]})
          .mockReturnValueOnce({ ...fullLearningObjectStub }),
    }));
});

describe('When buildHierarchicalLearningObject is called', () => {

    beforeAll(() => {
        LearningObjectAdapter.open(
            new MockDataStore(),
            new MockLibraryDriver(),
        );
    });

    describe('and the requester provides a valid Learning Object', () => {
        it('should return a complete hierarchy Learning Object', async () => {
            await buildHierarchicalLearningObject({ ...fullLearningObjectStub, children: [learningObjectChildSummaryStub] } as LearningObject, requesterStub);
        });
    });
});
