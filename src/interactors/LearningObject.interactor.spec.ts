import { LearningObjectInteractor } from '../interactors/interactors';
import { DataStore } from '../shared/interfaces/DataStore';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import { Stubs } from '../tests/stubs';

const dataStore: DataStore = new MockDataStore();
const library: LibraryCommunicator = new MockLibraryDriver();
const stubs = new Stubs();

describe('searchUsersObjects', () => {
  it('should load learning object summary', done => {
    // FIXME: Why does this function take a usertoken and a username?
    return LearningObjectInteractor.searchUsersObjects({
      dataStore,
      requester: stubs.userToken,
      authorUsername: stubs.userToken.username,
    })
      .then(val => {
        expect(val[0]).toMatchObject({
          id: expect.any(String),
          author: {
            id: expect.any(String),
            username: expect.any(String),
            name: expect.any(String),
            organization: expect.any(String),
          },
          collection: expect.any(String),
          contributors: expect.arrayContaining(
            []),
          children: expect.arrayContaining(
            [{
              name: expect.any(String),
              id: expect.any(String),
            }]),
          date: expect.any(String),
          description: expect.any(String),
          length: expect.any(String),
          name: expect.any(String),
          revision: expect.any(Number),
          status: expect.any(String),

        });

        done();
      })
      .catch(error => {
        throw new Error('Failed to load summary.');
      });
  });
});

describe('loadProfile', () => {
  it('should return an array of learning object summaries', done => {
    return LearningObjectInteractor.loadProfile({
      dataStore,
      userToken: stubs.userToken,
      username: stubs.userToken.username,
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });

  it('should return an array of learning object summaries', done => {
    return LearningObjectInteractor.loadProfile({
      dataStore,
      userToken: undefined,
      username: stubs.userToken.username,
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });
});

describe('fetchObjectsByIDs', () => {
  it('should load full learning object', done => {
    return LearningObjectInteractor.fetchObjectsByIDs({
      dataStore,
      library,
      ids: [stubs.learningObject.id],
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });

  it('should return learning object - given empty array!', done => {
    return LearningObjectInteractor.fetchObjectsByIDs({
      dataStore,
      library,
      ids: [],
    })
      .then(val => {
        expect(val).toBeInstanceOf(Array);
        done();
      });
  });
});

describe('getLearningObjectId', () => {
  it('should find a learning object ID', done => {
    return LearningObjectInteractor.getLearningObjectId({
      dataStore,
      username: stubs.learningObject.author.username,
      learningObjectName: stubs.learningObject.name,
      userToken: stubs.userToken,
    })
      .then(val => {
        expect(val).toEqual(stubs.learningObject.id);
        done();
      });
  });
});
