import {CollectionDataStore} from './CollectionDataStore';

export async function fetchCollections(dataStore: CollectionDataStore): Promise<any> {
  try {
    return await dataStore.fetchCollections();
  } catch (e) {
    console.error(e);
    return Promise.reject(`Problem fetching collections. Error: ${e}`);
  }
}

export async function fetchCollection(
  dataStore: CollectionDataStore,
  name: string,
): Promise<any> {
  try {
    return await dataStore.fetchCollection(name);
  } catch (e) {
    return Promise.reject(`Problem fetching collection. Error: ${e}`);
  }
}

export async function fetchCollectionMeta(
  dataStore: CollectionDataStore,
  name: string,
): Promise<any> {
  try {
    return await dataStore.fetchCollectionMeta(name);
  } catch (e) {
    return Promise.reject(
      `Problem fetching collection metadata. Error: ${e}`,
    );
  }
}

export async function fetchCollectionObjects(
  dataStore: CollectionDataStore,
  name: string,
): Promise<any> {
  try {
    return await dataStore.fetchCollectionObjects(name);
  } catch (e) {
    return Promise.reject(`Problem fetching collection objects. Error: ${e}`);
  }
}
