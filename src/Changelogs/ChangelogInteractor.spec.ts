import { DataStore } from '../interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MOCK_OBJECTS } from '../tests/mocks';
import {
  getRecentChangelog,
  createChangelog,
  getAllChangelogs,
} from './ChangelogInteractor';
import { get } from 'http';
import { ResourceError } from '../errors';
import { rejects } from 'assert';

const dataStore: DataStore = new MockDataStore(); // DataStore

describe('getRecentChangelog', () => {
  it('should get latest changelog for a learning object (admin)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: MOCK_OBJECTS.USER_ID,
        user: MOCK_OBJECTS.USERTOKEN_ADMIN,
    }))
    .resolves.toHaveProperty('learningObjectId', MOCK_OBJECTS.LEARNING_OBJECT_ID);
  });

  it('should get latest changelog for a learning object (editor)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: MOCK_OBJECTS.USER_ID,
        user: MOCK_OBJECTS.USERTOKEN_EDITOR,
    }))
    .resolves.toHaveProperty('learningObjectId', MOCK_OBJECTS.LEARNING_OBJECT_ID);
  });

  it('should get latest changelog for a learning object (author)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: MOCK_OBJECTS.USER_ID,
        user: MOCK_OBJECTS.USERTOKEN,
    }))
    .resolves.toHaveProperty('learningObjectId', MOCK_OBJECTS.LEARNING_OBJECT_ID);
  });

  it('should throw not found', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: '123',
        userId: MOCK_OBJECTS.USER_ID,
        user: MOCK_OBJECTS.USERTOKEN,
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw not found', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: '123',
        user: MOCK_OBJECTS.USERTOKEN,
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw invalid accerss (curator)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: '123',
        user: MOCK_OBJECTS.USERTOKEN_CURATOR_C5,
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw invalid accerss (reviewer)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: '123',
        user: MOCK_OBJECTS.USERTOKEN_REVIEWER_C5,
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw invalid accerss (non-author)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
        userId: '123',
        user: MOCK_OBJECTS.USERTOKEN,
    }))
    .rejects.toBe(ResourceError);
  });
});


describe('createChangelog', () => {
    it('should create a new changelog (admin)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN_ADMIN,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .resolves.toBe(undefined);
    });

    it('should create a new changelog (editor)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN_ADMIN,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .resolves.toBe(undefined);
    });

    it('should create a new changelog (author)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .resolves.toBe(undefined);
    });

    it('should throw not found', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: '123',
          user: MOCK_OBJECTS.USERTOKEN,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .rejects.toBe(ResourceError);
    });

    it('should throw not found', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN,
          userId: '123',
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .rejects.toBe(ResourceError);
    });

    it('should throw invalid access (curator)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN_CURATOR_C5,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .rejects.toBe(ResourceError);
    });

    it('should throw invalid access (reviewer)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN_REVIEWER_C5,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .rejects.toBe(ResourceError);
    });

    it('should throw invalid access (non-author)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
          user: MOCK_OBJECTS.USERTOKEN_ALT,
          userId: MOCK_OBJECTS.USER_ID,
          changelogText: MOCK_OBJECTS.CHANGELOG_TEXT,
      }))
      .rejects.toBe(ResourceError);
    });
});

describe('getAllChangelogs', () => {
  it('should return all changelogs for a learning object (admin)', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      user: MOCK_OBJECTS.USERTOKEN_ADMIN,
      userId: MOCK_OBJECTS.USER_ID,
    }))
    .resolves.toHaveLength(1);
  });

  it('should return all changelogs for a learning object (editor)', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      user: MOCK_OBJECTS.USERTOKEN_EDITOR,
      userId: MOCK_OBJECTS.USER_ID,
    }))
    .resolves.toHaveLength(1);
  });

  it('should return all changelogs for a learning object (editor)', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      user: MOCK_OBJECTS.USERTOKEN_EDITOR,
      userId: MOCK_OBJECTS.USER_ID,
    }))
    .resolves.toHaveLength(1);
  });

  it('should throw not found', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: '123',
      user: MOCK_OBJECTS.USERTOKEN_EDITOR,
      userId: MOCK_OBJECTS.USER_ID,
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw not found', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      user: MOCK_OBJECTS.USERTOKEN_EDITOR,
      userId: '123',
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw invalid access (curator)', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      user: MOCK_OBJECTS.USERTOKEN_CURATOR_C5,
      userId: MOCK_OBJECTS.USER_ID,
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw invalid access (reviewer)', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      user: MOCK_OBJECTS.USERTOKEN_REVIEWER_C5,
      userId: MOCK_OBJECTS.USER_ID,
    }))
    .rejects.toBe(ResourceError);
  });

  it('should throw invalid access (non-author)', async () => {
    return expect(getAllChangelogs({
      dataStore,
      learningObjectId: MOCK_OBJECTS.LEARNING_OBJECT_ID,
      user: MOCK_OBJECTS.USERTOKEN_ALT,
      userId: MOCK_OBJECTS.USER_ID,
    }))
    .rejects.toBe(ResourceError);
  });
});
