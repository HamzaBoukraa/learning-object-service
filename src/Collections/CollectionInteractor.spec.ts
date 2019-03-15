import * as CollectionInteractor from './CollectionInteractor';
import {MOCK_OBJECTS} from '../tests/mocks';
import {MockDataStore} from '../tests/mock-drivers/MockDataStore';
import {CollectionDataStore} from './CollectionDataStore';

const mockStore: CollectionDataStore = new MockDataStore();

describe('fetchCollections', () => {
  it('should return an array of objects - these objects contain lo IDs', done => {
    return CollectionInteractor.fetchCollections(mockStore).then(val => {
      expect(val).toBeInstanceOf(Array);
      done();
    });
  });
});

describe('fetchCollection', () => {
  it('should return an object - contains an array of learning objects ', done => {
    return CollectionInteractor.fetchCollection(
      mockStore,
      MOCK_OBJECTS.COLLECTION_NAME,
    ).then(val => {
      expect(val).toBeDefined();
      done();
    });
  });
});

describe('fetchCollectionMeta', () => {
  it('should return an object with the collection metadata', async () => {
    const collectionMetadata = await CollectionInteractor.fetchCollectionMeta(mockStore, 'name');
    expect(collectionMetadata).toBeDefined();
  });
});

