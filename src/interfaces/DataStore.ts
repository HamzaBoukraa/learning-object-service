import {
  LearningObject,
  LearningOutcome,
  StandardOutcome,
  User,
  Collection,
} from '@cyber4all/clark-entity';
import { LearningObjectLock } from '../interactors/AdminLearningObjectInteractor';

export interface DataStore {
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  insertLearningObject(object: LearningObject): Promise<string>;
  reorderOutcome(
    objectID: string,
    outcomeID: string,
    index: number,
  ): Promise<void>;
  editLearningObject(id: string, object: LearningObject): Promise<void>;
  toggleLock(id: string, lock?: LearningObjectLock): Promise<void>;
  deleteLearningObject(id: string): Promise<void>;
  deleteMultipleLearningObjects(ids: string[]): Promise<void>;
  getUserObjects(username: string): Promise<string[]>;
  findLearningObject(username: string, name: string): Promise<string>;
  fetchLearningObject(
    id: string,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject>;
  fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
  ): Promise<LearningObject[]>;
  fetchAllObjects(
    accessUnpublished?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }>;
  searchObjects(
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }>;
  fetchCollections(loadObjects?: boolean): Promise<Collection[]>;
  fetchCollection(name: string): Promise<Collection>;
  fetchCollectionMeta(name: string): Promise<any>;
  fetchCollectionObjects(name: string): Promise<LearningObject[]>;
  togglePublished(
    username: string,
    id: string,
    published: boolean,
  ): Promise<void>;
  insertChild(parentId: string, childId: string): Promise<void>;
  deleteChild(parentId: string, childId: string): Promise<void>;
  findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<LearningObject[]>;
}

export { Collection as LearningObjectCollection };

export interface Filters {
  orderBy?: string;
  sortType?: -1 | 1;
  page?: number;
  limit?: number;
}

export interface LearningObjectQuery extends Filters {
  id?: string;
  name?: string;
  author?: string;
  length?: string[];
  level?: string[];
  standardOutcomeIDs?: string[];
  text?: string;
  full?: boolean;
}
