import * as CollectionInteractor from './CollectionInteractor';
import {MockDataStore} from '../tests/mock-drivers/MockDataStore';
import {CollectionDataStore} from './CollectionDataStore';
import { Stubs } from '../tests/stubs';

const mockStore: CollectionDataStore = new MockDataStore();
const stubs = new Stubs();

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
      stubs.collection.name,
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

