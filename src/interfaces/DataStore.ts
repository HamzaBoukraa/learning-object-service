import { LearningObject, LearningOutcome, StandardOutcome, User, Collection } from "@cyber4all/clark-entity";

export interface DataStore {
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  insertLearningObject(object: LearningObject): Promise<string>;
  insertLearningOutcome(
    outcome: LearningOutcome
  ): Promise<string>;
  insertStandardOutcome(
    outcome: StandardOutcome
  ): Promise<string>;
  mapOutcome(outcomeID: string, mappingID: string): Promise<void>;
  unmapOutcome(outcomeID: string, mappingID: string): Promise<void>;
  reorderOutcome(
    objectID: string,
    outcomeID: string,
    index: number
  ): Promise<void>;
  editLearningObject(
    id: string,
    object: LearningObject
  ): Promise<void>;
  editLearningOutcome(
    id: string,
    outcome: LearningOutcome
  ): Promise<void>;
  deleteLearningObject(id: string): Promise<void>;
  deleteMultipleLearningObjects(ids: string[]): Promise<void>;
  deleteLearningOutcome(id: string): Promise<void>;
  // Remove and replace with request to user microservice
  findUser(username: string): Promise<string>;
  findLearningObject(username: string, name: string): Promise<string>;
  findLearningOutcome(
    sourceID: string,
    tag: number
  ): Promise<string>;
  // Remove and replace with request to user microservice
  fetchUser(id: string): Promise<User>;
  fetchLearningObject(
    id: string,
    accessUnpublished?: boolean
  ): Promise<LearningObject>;
  fetchLearningOutcome(id: string): Promise<LearningOutcome>;
  fetchOutcome(id: string): Promise<StandardOutcome>;
  fetchMultipleObjects(
    ids: string[]
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
  findMappingID(
    date: string,
    name: string,
    outcome: string
  ): Promise<string>;
  fetchCollections(): Promise<Collection[]>;
  fetchCollection(name: string): Promise<Collection>;
}

export { Collection as LearningObjectCollection };