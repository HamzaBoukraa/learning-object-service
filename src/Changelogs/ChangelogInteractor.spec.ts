import { DataStore } from '../shared/interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

import {
  getRecentChangelog,
  createChangelog,
  getChangelogs,
} from './ChangelogInteractor';

import { Stubs } from '../tests/stubs';

const dataStore: DataStore = new MockDataStore();
const stubs = new Stubs();

describe('getRecentChangelog', () => {
  it('should get latest changelog for a learning object (admin)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: stubs.learningObject.id,
        userId: stubs.learningObject.author.id,
        user: {...stubs.userToken, accessGroups: ['admin']},
    }))
    .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
  });

  it('should get latest changelog for a learning object (editor)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: stubs.learningObject.id,
        userId: stubs.learningObject.author.id,
        user: {...stubs.userToken, accessGroups: ['editor']},
    }))
    .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
  });

  it('should get latest changelog for a learning object (author)', async () => {
    return expect(getRecentChangelog({
        dataStore,
        learningObjectId: stubs.learningObject.id,
        userId: stubs.learningObject.author.id,
        user: {...stubs.userToken, accessGroups: ['']},
    }))
    .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
  });
});


describe('createChangelog', () => {
    it('should create a new changelog (admin)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['admin']},
          userId: stubs.learningObject.author.id,
          changelogText: 'Example change log text',
      }))
      .resolves.toBe(undefined);
    });

    it('should create a new changelog (editor)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['editor']},
          userId: stubs.learningObject.author.id,
          changelogText: 'Example change log text',
      }))
      .resolves.toBe(undefined);
    });

    it('should create a new changelog (author)', async () => {
      return expect(createChangelog({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['']},
          userId: stubs.learningObject.author.id,
          changelogText: 'Example change log text',
      }))
      .resolves.toBe(undefined);
    });
});



describe('getChangelogs', () => {
  describe('Checking the getAllChangelogs pathway', () => {
    describe('When I am an admin', () => {
      it('should return all changelogs for a learning object', async () => {
        return expect(getChangelogs({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['admin']},
          userId: stubs.learningObject.author.id,
        }))
        .resolves.toHaveLength(1);
      });
    });
    describe('When I am an editor', () => {
      it('should return all changelogs for a learning object', async () => {
        return expect(getChangelogs({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['editor']},
          userId: stubs.learningObject.author.id,
        }))
        .resolves.toHaveLength(1);
      });
    });
  });

  describe('Checking getChangelogsBeforeDate pathway', () => {
    describe('When I am an admin', () => {
      it('should return all changelogs before a specified date for a learning object', async () => {
        return expect(getChangelogs({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['admin']},
          userId: stubs.learningObject.author.id,
          date: stubs.learningObject.date,
        }))
        .resolves.toHaveLength(1);
      });

      it('should return all changelogs before a specified date for a learning object', async () => {
        return expect(getChangelogs({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['admin']},
          userId: stubs.learningObject.author.id,
          date: '1',
        }))
        .resolves.toHaveLength(1);
      });
    });

    describe('When I am an editor', () => {
      it('should return all changelogs before a specified date for a learning object', async () => {
        return expect(getChangelogs({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['editor']},
          userId: stubs.learningObject.author.id,
          date: stubs.learningObject.date,
        }))
        .resolves.toHaveLength(1);
      });

      it('should return all changelogs before a specified date for a learning object', async () => {
        return expect(getChangelogs({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['editor']},
          userId: stubs.learningObject.author.id,
          date: '1',
        }))
        .resolves.toHaveLength(1);
      });
    });
  });
});

