import { DataStore } from '../shared/interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { StubModuleLearningObjectGateway } from './testing/StubModuleLearningObjectGateway';
import { Stubs } from '../tests/stubs';

const dataStore: DataStore = new MockDataStore();
const learningObjectGateway = new StubModuleLearningObjectGateway();
const stubs = new Stubs();

let ChangelogInteractor: any;

beforeAll(async () => {
  jest.mock('../shared/gateways/user-service/UserServiceGateway');
  ChangelogInteractor = await import('./ChangelogInteractor');
});

jest.doMock('../shared/gateways/user-service/UserServiceGateway', () => ({
  __esModule: true,
  UserServiceGateway: {
    getInstance: () => ({
      findUser: jest
      .fn()
      .mockResolvedValue(stubs.user),
    }),
  },
}));

describe('getRecentChangelog', () => {
  it('should get latest change log for a learning object (admin)', async () => {
    return expect(ChangelogInteractor.getRecentChangelog({
        dataStore,
        learningObjectId: stubs.learningObject.id,
        userId: stubs.learningObject.author.id,
        user: {...stubs.userToken, accessGroups: ['admin']},
    }))
    .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
  });

  it('should get latest change log for a learning object (editor)', async () => {
    return expect(ChangelogInteractor.getRecentChangelog({
        dataStore,
        learningObjectId: stubs.learningObject.id,
        userId: stubs.learningObject.author.id,
        user: {...stubs.userToken, accessGroups: ['editor']},
    }))
    .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
  });

  it('should get latest change log for a learning object (author)', async () => {
    return expect(ChangelogInteractor.getRecentChangelog({
        dataStore,
        learningObjectId: stubs.learningObject.id,
        userId: stubs.learningObject.author.id,
        user: {...stubs.userToken, accessGroups: ['']},
    }))
    .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
  });
});

describe('createChangelog', () => {
    it('should create a new change log (admin)', async () => {
      return expect(ChangelogInteractor.createChangelog({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['admin']},
          userId: stubs.learningObject.author.id,
          changelogText: 'Example change log text',
      }))
      .resolves.toBe(undefined);
    });

    it('should create a new change log (editor)', async () => {
      return expect(ChangelogInteractor.createChangelog({
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['editor']},
          userId: stubs.learningObject.author.id,
          changelogText: 'Example change log text',
      }))
      .resolves.toBe(undefined);
    });

    it('should create a new change log (author)', async () => {
      return expect(ChangelogInteractor.createChangelog({
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
  describe('When I request change logs for a Learning Object that is released and does not have any revisions', () => {
    describe('and I ask for all change logs', () => {
      it('should return all change logs for the specified learning object', async () => {
        return expect(ChangelogInteractor.getChangelogs({
          learningObjectGateway,
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['']},
          userId: stubs.learningObject.author.id,
        }))
        .resolves.toHaveLength(1);
      });
    });
    describe('and I ask for the most recent change log', () => {
      it('should return only the most recent change log for the specified Learning Object', async () => {
        return expect(ChangelogInteractor.getChangelogs({
          learningObjectGateway,
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['']},
          userId: stubs.learningObject.author.id,
          recent: true,
        }))
        .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
      });
    });
  });

  describe('When I request change logs for a Learning Object that is not released (and does not have any revisions)', () => {
    describe('and I am an admin', () => {
      describe('and I ask for all change logs', () => {
        it('should return all change logs for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['admin']},
            userId: stubs.learningObject.author.id,
          }))
          .resolves.toHaveLength(1);
        });
      });
      describe('and I ask for the most recent change log', () => {
        it('should return only the most recent change log for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['admin']},
            userId: stubs.learningObject.author.id,
            recent: true,
          }))
          .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
        });
      });
    });
    describe('and I am an editor', () => {
      describe('and I ask for all change logs', () => {
        it('should return all change logs for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['editor']},
            userId: stubs.learningObject.author.id,
          }))
          .resolves.toHaveLength(1);
        });
      });
      describe('and I ask for the most recent change log', () => {
        it('should return only the most recent change log for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['editor']},
            userId: stubs.learningObject.author.id,
            recent: true,
          }))
          .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
        });
      });
    });
    describe('and I am the Learning object author', () => {
      describe('and I ask for all change logs', () => {
        it('should return all change logs for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: [''], username: stubs.learningObject.author.username},
            userId: stubs.learningObject.author.id,
          }))
          .resolves.toHaveLength(1);
        });
      });
      describe('and I ask for the most recent change log', () => {
        it('should return only the most recent change log for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: [''], username: stubs.learningObject.author.username},
            userId: stubs.learningObject.author.id,
            recent: true,
          }))
          .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
        });
      });
    });
  });
  describe('When I request change logs for a Learning Object that has revisions, but I ask for change logs relevant to the released copy', () => {
    describe('and I ask for all change logs', () => {
      it('should return all change logs that are relevant to the released copy for the specified learning object', async () => {
        return expect(ChangelogInteractor.getChangelogs({
          learningObjectGateway,
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['']},
          userId: stubs.learningObject.author.id,
          minusRevision: true,
        }))
        .resolves.toHaveLength(1);
      });
    });
    describe('and I ask for the most recent change log', () => {
      it('should return only the most recent change log that is relevant to the released copy for the specified Learning Object', async () => {
        return expect(ChangelogInteractor.getChangelogs({
          learningObjectGateway,
          dataStore,
          learningObjectId: stubs.learningObject.id,
          user: {...stubs.userToken, accessGroups: ['']},
          userId: stubs.learningObject.author.id,
          recent: true,
          minusRevision: true,
        }))
        .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
      });
    });
  });
  describe('When I request change logs for a Learning Object that has revisions and I ask for change logs relevant to the working copy and released copy', () => {
    describe('and I am an admin', () => {
      describe('and I ask for all change logs', () => {
        it('should return all change logs for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['admin']},
            userId: stubs.learningObject.author.id,
          }))
          .resolves.toHaveLength(1);
        });
      });
      describe('and I ask for the most recent change log', () => {
        it('should return only the most recent change log for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['admin']},
            userId: stubs.learningObject.author.id,
            recent: true,
          }))
          .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
        });
      });
    });
    describe('and I am an editor', () => {
      describe('and I ask for all change logs', () => {
        it('should return all change logs for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['editor']},
            userId: stubs.learningObject.author.id,
          }))
          .resolves.toHaveLength(1);
        });
      });
      describe('and I ask for the most recent change log', () => {
        it('should return only the most recent change log for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {...stubs.userToken, accessGroups: ['editor']},
            userId: stubs.learningObject.author.id,
            recent: true,
          }))
          .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
        });
      });
    });
    describe('and I am the Learning Object author', () => {
      describe('and I ask for all change logs', () => {
        it('should return all change logs for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {
              ...stubs.userToken,
              accessGroups: [''],
              username: stubs.learningObject.author.username,
            },
            userId: stubs.learningObject.author.id,
          }))
          .resolves.toHaveLength(1);
        });
      });
      describe('and I ask for the most recent change log', () => {
        it('should return only the most recent change log for the specified Learning Object', async () => {
          return expect(ChangelogInteractor.getChangelogs({
            learningObjectGateway,
            dataStore,
            learningObjectId: stubs.learningObject.id,
            user: {
              ...stubs.userToken,
              accessGroups: [''],
              username: stubs.learningObject.author.username,
            },
            userId: stubs.learningObject.author.id,
            recent: true,
          }))
          .resolves.toHaveProperty('learningObjectId', stubs.learningObject.id);
        });
      });
    });
  });
});

