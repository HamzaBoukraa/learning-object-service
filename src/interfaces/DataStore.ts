import { Collection, LearningObject, User } from '@cyber4all/clark-entity';
import { CompletedPart, MultipartFileUploadStatus } from './FileManager';
import { LearningObjectUpdates } from '../types';
import { LearningOutcomeDatastore } from '../LearningOutcomes/LearningOutcomeInteractor';
import { LearningObjectStatDatastore } from '../LearningObjectStats/LearningObjectStatsInteractor';
import { CollectionDataStore } from '../Collections/CollectionDataStore';

export interface DataStore
  extends LearningOutcomeDatastore,
    LearningObjectStatDatastore,
    CollectionDataStore {
  /*
   * Datastore Connection Management
   */
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  /*
   * CREATE Operations
   */

  // LearningObjects
  insertLearningObject(object: LearningObject): Promise<string>;

  // File Uploads
  insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void>;
  /*
   * READ Operations
   */

  // Learning Objects
  getUserObjects(username: string): Promise<string[]>;
  findLearningObject(username: string, name: string): Promise<string>;
  fetchLearningObject(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject>;
  fetchMultipleObjects(params: {
    ids: string[];
    full?: boolean;
    status: string[];
    orderBy?: string;
    sortType?: number;
  }): Promise<LearningObject[]>;
  fetchAllObjects(params: {
    status: string[];
    page?: number;
    limit?: number;
  }): Promise<{ objects: LearningObject[]; total: number }>;
  searchObjects(
    params: LearningObjectQuery,
  ): Promise<{ objects: LearningObject[]; total: number }>;
  searchObjectsWithConditions(
    params: LearningObjectQueryWithConditions,
  ): Promise<{
    total: number;
    objects: LearningObject[];
  }>;
  findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<LearningObject[]>;
  findParentObjectIds(params: { childId: string }): Promise<string[]>;
  loadChildObjects(params: {
    id: string;
    full?: boolean;
    status?: string[];
  }): Promise<LearningObject[]>;

  // Materials
  findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObject.Material.File>;
  getLearningObjectMaterials(params: {
    id: string;
  }): Promise<LearningObject.Material>;

  // File Uploads
  fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus>;

  // Users
  findUser(username: string): Promise<string>;
  fetchUser(id: string): Promise<User>;
  peek<T>(params: {
    query: { [index: string]: string };
    fields: { [index: string]: 0 | 1 };
  }): Promise<T>;

  /*
   * UPDATE Operations
   */

  // Learning Objects
  editLearningObject(params: {
    id: string;
    updates: LearningObjectUpdates;
  }): Promise<void>;
  updateMultipleLearningObjects(params: {
    ids: string[];
    updates: LearningObjectUpdates;
  }): Promise<void>;
  submitLearningObjectToCollection(
    username: string,
    id: string,
    collection: string,
  ): Promise<void>;
  unsubmitLearningObject(id: string): Promise<void>;
  setChildren(parentId: string, children: string[]): Promise<void>;
  deleteChild(parentId: string, childId: string): Promise<void>;
  addToCollection(learningObjectId: string, collection: string): Promise<void>;

  // Materials
  addToFiles(params: {
    id: string;
    loFile: LearningObject.Material.File;
  }): Promise<void>;
  removeFromFiles(params: { objectId: string; fileId: string }): Promise<void>;
  updateFileDescription(params: {
    learningObjectId: string;
    fileId: string;
    description: string;
  }): Promise<LearningObject.Material.File>;

  // File Uploads
  updateMultipartUploadStatus(params: {
    id: string;
    completedPart: CompletedPart;
  }): Promise<void>;

  /*
   * DELETE Operations
   */

  // Learning Objects
  deleteLearningObject(id: string): Promise<void>;
  deleteMultipleLearningObjects(ids: string[]): Promise<void>;

  // File Uploads
  deleteMultipartUploadStatus(params: { id: string }): Promise<void>;
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
  collection?: string[];
  status?: string[];
}

export interface LearningObjectQueryWithConditions extends Filters {
  name?: string;
  author?: string;
  length?: string[];
  level?: string[];
  standardOutcomeIDs?: string[];
  text?: string;
  conditions: QueryCondition[];
}

export interface QueryCondition {
  [index: string]: string | string[];
}
