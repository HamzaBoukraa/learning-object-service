import { Collection } from '../entity';

export interface CollectionDataStore {
  fetchCollections(loadObjects?: boolean): Promise<Collection[]>;
  fetchCollection(name: string): Promise<Collection>;
  fetchCollectionMeta(name: string): Promise<any>;
  fetchCollectionStats(): Promise<any>;
}
