import { DataStore } from '../shared/interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

import {
  getRecentChangelog,
  createChangelog,
  getAllChangelogs,
} from './ChangelogInteractor';
import { get } from 'http';
import { ResourceError } from '../shared/errors';
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
});
