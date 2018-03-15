import {
  LearningObject,
  LearningOutcome,
  StandardOutcome,
  User,
  Collection
} from '@cyber4all/clark-entity';

export interface DataStore {
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  insertLearningObject(object: LearningObject): Promise<string>;
  reorderOutcome(
    objectID: string,
    outcomeID: string,
    index: number
  ): Promise<void>;
  editLearningObject(id: string, object: LearningObject): Promise<void>;
  deleteLearningObject(id: string): Promise<void>;
  deleteMultipleLearningObjects(ids: string[]): Promise<void>;
  getUserObjects(username: string): Promise<string[]>;
  findLearningObject(username: string, name: string): Promise<string>;
  fetchLearningObject(
    id: string,
    full?: boolean,
    accessUnpublished?: boolean
  ): Promise<LearningObject>;
  fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean
  ): Promise<LearningObject[]>;
  fetchAllObjects(
    currPage?: number,
    limit?: number
  ): Promise<{ objects: LearningObject[]; total: number }>;
  searchObjects(
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    orderBy?: string,
    sortType?: number,
    currPage?: number,
    limit?: number
  ): Promise<{ objects: LearningObject[]; total: number }>;
  fetchCollections(loadObjects?: boolean): Promise<Collection[]>;
  fetchCollection(name: string): Promise<Collection>;
  togglePublished(
    username: string,
    id: string,
    published: boolean
  ): Promise<void>;
}

export { Collection as LearningObjectCollection };
