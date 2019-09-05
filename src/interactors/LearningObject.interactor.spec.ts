import { DataStore } from '../shared/interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { Stubs } from '../tests/stubs';
const dataStore: DataStore = new MockDataStore();
const stubs = new Stubs();

jest.doMock('../shared/gateways/user-service/UserServiceGateway', () => ({
  __esModule: true,
  UserServiceGateway: {
    getInstance: () => ({
      findUser: jest
      .fn()
      .mockResolvedValue({...stubs.user}),
    }),
  },
}));

let interactor: any;

describe('LearningObjectInteractor', () => {
  beforeAll(async () => {
    jest.doMock('../shared/gateways/user-service/UserServiceGateway', () => ({
      __esModule: true,
      UserServiceGateway: {
        getInstance: () => ({
          findUser: jest.fn().mockResolvedValue(stubs.user),
        }),
      },
    }));
    interactor = (await import('./LearningObjectInteractor')).LearningObjectInteractor;
  });

  describe('fetchObjectsByIDs', () => {
    it('should load full learning object', async () => {
      return expect(interactor.fetchObjectsByIDs({
        dataStore,
        ids: [stubs.learningObject.id],
      })).resolves.toBeInstanceOf(Array);
    });

    it('should return learning object - given empty array!', async () => {
      return expect(interactor.fetchObjectsByIDs({
        dataStore,
        ids: [],
      })).resolves.toBeInstanceOf(Array);
      });
    });

  describe('getLearningObjectId', () => {
    it('should find a learning object ID', async () => {
      return expect(interactor.getLearningObjectId({
        dataStore,
        username: stubs.learningObject.author.username,
        learningObjectName: stubs.learningObject.name,
        userToken: stubs.userToken,
      })).resolves.toBe(stubs.learningObject.id);
    });
  });
});
