import { Collection } from '../shared/entity';

export interface CollectionDataStore {
  fetchCollections(loadObjects?: boolean): Promise<Collection[]>;
  fetchCollection(name: string): Promise<Collection>;
  fetchCollectionMeta(name: string): Promise<any>;
}
