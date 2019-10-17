import { UserToken } from '../../shared/types';
import { LearningObject } from '../../shared/entity';
import { RevisionsDataStore } from '../RevisionsDataStore';
import { ERROR_MESSAGES } from './createLearningObjectRevision';

// fixtures
const releasedLearningObject = new LearningObject({ name: 'Something', status: 'released', cuid: '12345', author: { username: 'someusername' }, revision: 0 });
const revisionLearningObject = new LearningObject({ name: 'Something', status: 'unreleased', cuid: '12345', author: { username: 'someusername' }, revision: 0 });
const proofingLearningObject = new LearningObject({ name: 'Something', status: 'proofing', cuid: '12345', author: { username: 'someusername' }, revision: 0 });

class MockRevisionsDataStore implements RevisionsDataStore {
  createRevision(cuid: string, newRevisionId: number, revisionStatus?: LearningObject.Status.UNRELEASED | LearningObject.Status.PROOFING) {
    return Promise.resolve();
  }
}

const requester: UserToken = {
  username: 'someusername',
  name: 'Some Name',
  email: 'Some Email',
  organization: 'Some Organization',
  emailVerified: true,
  accessGroups: [],
};


const badRequester: UserToken = {
  username: 'someotherusername',
  name: 'Some Name',
  email: 'Some Email',
  organization: 'Some Organization',
  emailVerified: true,
  accessGroups: [],
};

// mock the LearningObjectAdapter
jest.mock('../../LearningObjects/adapters/LearningObjectAdapter', () => ({
  __esModule: true,
  LearningObjectAdapter: {
    getInstance: jest.fn()
      .mockReturnValueOnce({ getInternalLearningObjectByCuid: () => [] as LearningObject[] })
      .mockReturnValueOnce({ getInternalLearningObjectByCuid: () => [releasedLearningObject, revisionLearningObject] })
      .mockReturnValueOnce({ getInternalLearningObjectByCuid: () => [releasedLearningObject, proofingLearningObject] })
      .mockReturnValueOnce({ getInternalLearningObjectByCuid: () => [revisionLearningObject] })
      .mockReturnValue({ getInternalLearningObjectByCuid: () => [releasedLearningObject] }),
    },
  }),
);

// mock the FileManagerModule
jest.mock('../../FileManager/FileManagerModule', () => ({
  __esModule: true,
  FileManagerModule: {
    duplicateRevisionFiles: jest.fn().mockResolvedValue(Promise.resolve())
  },
}));

describe('When createLearningObjectRevision is called', () => {
  let createLearningObjectRevision: (params: {
    username: string,
    cuid: string,
    dataStore: RevisionsDataStore,
    requester: UserToken,
  }) => Promise<number>; // this is instantiated in the beforeAll function

  beforeAll(async () => {
    // import the createLearningObjectRevision after mocks are ready
    const x = await import('./createLearningObjectRevision');
    createLearningObjectRevision = x.createLearningObjectRevision;
  });

  describe('and the specified Learning Object doesn\'t exist', () => {
    it('should throw an error', async () => {
      await expect(createLearningObjectRevision({ cuid: '12345', username: 'someusername', dataStore: new MockRevisionsDataStore(), requester }))
        .rejects
        .toThrowError(ERROR_MESSAGES.REVISIONS.LEARNING_OBJECT_DOES_NOT_EXIST('12345'));
    });
  });

  describe('and the author has already created a revision', () => {
    it('should throw an error', async () => {
      await expect(createLearningObjectRevision({ cuid: '12345', username: 'someusername', dataStore: new MockRevisionsDataStore(), requester }))
        .rejects
        .toThrowError(ERROR_MESSAGES.REVISIONS.UNRELEASED_EXISTS);
    });
  });

  describe('and there is already a submission in place', () => {
    it('should throw an error', async () => {
      await expect(createLearningObjectRevision({ cuid: '12345', username: 'someusername', dataStore: new MockRevisionsDataStore(), requester }))
        .rejects
        .toThrowError(ERROR_MESSAGES.REVISIONS.SUBMISSION_EXISTS);
    });
  });

  describe('and the Learning Object isn\'t released', () => {
    it('should throw an error', async () => {
      await expect(createLearningObjectRevision({ cuid: '12345', username: 'someusername', dataStore: new MockRevisionsDataStore(), requester }))
        .rejects
        .toThrowError(ERROR_MESSAGES.REVISIONS.LEARNING_OBJECT_NOT_RELEASED('12345'));
    });
  });

  describe('and the username in the route doesn\'t match the author\'s username', () => {
    it('should throw an incorrect author error', async () => {
      await expect(createLearningObjectRevision({ cuid: '12345', username: 'someOtherUsername', dataStore: new MockRevisionsDataStore(), requester: requester }))
        .rejects
        .toThrowError(ERROR_MESSAGES.REVISIONS.INCORRECT_AUTHOR(releasedLearningObject.cuid, 'someOtherUsername'));
    });
  });

  describe('and the requester isn\'t authorized to make a revision', () => {
    it('should throw an incorrect author error', async () => {
      await expect(createLearningObjectRevision({ cuid: '12345', username: 'someusername', dataStore: new MockRevisionsDataStore(), requester: badRequester }))
        .rejects
        .toThrowError(ERROR_MESSAGES.REVISIONS.INVALID_ACCESS);
    });
  });

  describe('and the request is valid', () => {
    it('should return a new version id', async () => {
      await expect(createLearningObjectRevision({ cuid: '12345', username: 'someusername', dataStore: new MockRevisionsDataStore(), requester: requester }))
        .resolves.toBe(releasedLearningObject.version + 1);
    });
  });
});
