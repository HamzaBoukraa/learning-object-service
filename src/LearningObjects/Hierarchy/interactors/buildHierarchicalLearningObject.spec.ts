import { LearningObject } from '../../../shared/entity';
import {
  UserToken,
  AuthorSummary,
  LearningObjectSummary,
} from '../../../shared/types';
const learningObjectSummaryStub: LearningObjectSummary = {
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
  levels: ['test'],
  name: 'test_name',
  revisionUri: 'test_uri',
  version: 0,
  status: 'test_status',
};

const fullLearningObjectStub = {
  id: 'toplevelparent',
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
jest.doMock('../../adapters/LearningObjectAdapter', () => ({
  __esModule: true,
  LearningObjectAdapter: {
    getInstance: () => ({
      getLearningObjectById: jest
        .fn()
        .mockResolvedValue({ ...fullLearningObjectStub }),
    }),
  },
}));

describe('When buildHierarchicalLearningObject is called', () => {
  describe('and the requester provides a valid Learning Object', () => {
    it('should return a complete hierarchy Learning Object', async () => {
      const buildHierarchicalLearningObject = (await import(
        './buildHierarchicalLearningObject'
      )).buildHierarchicalLearningObject;
      const hierarchy = await buildHierarchicalLearningObject(
        {
          ...fullLearningObjectStub,
          children: [learningObjectSummaryStub],
        } as LearningObject,
        requesterStub,
      );
      const expected = {
        ...fullLearningObjectStub,
        children: [fullLearningObjectStub],
      };
      expect(hierarchy).toEqual(expected);
    });
  });
});
