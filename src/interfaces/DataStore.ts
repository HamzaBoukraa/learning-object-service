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
  connect(dburi: string): Promise<void>;
  disconnect(): void;
  insertLearningObject(object: LearningObject): Promise<string>;
  editLearningObject(params: {
    id: string;
    updates: LearningObjectUpdates;
  }): Promise<void>;
  updateMultipleLearningObjects(params: {
    ids: string[];
    updates: LearningObjectUpdates;
  }): Promise<void>;
  toggleLock(id: string, lock?: LearningObject.Lock): Promise<void>;
  deleteLearningObject(id: string): Promise<void>;
  deleteMultipleLearningObjects(ids: string[]): Promise<void>;
  getUserObjects(username: string): Promise<string[]>;
  findLearningObject(username: string, name: string): Promise<string>;
  fetchLearningObject(id: string, full?: boolean): Promise<LearningObject>;
  fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    orderBy?: string,
    sortType?: number,
  ): Promise<LearningObject[]>;
  fetchAllObjects(
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }>;
  searchObjects(
    params: LearningObjectQuery,
  ): Promise<{ objects: LearningObject[]; total: number }>;
  submitLearningObjectToCollection(
    username: string,
    id: string,
    collection: string,
  ): Promise<void>;
  unsubmitLearningObject(id: string): Promise<void>;
  setChildren(parentId: string, children: string[]): Promise<void>;
  deleteChild(parentId: string, childId: string): Promise<void>;
  findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<LearningObject[]>;
  findParentObjectIds(params: { childId: string }): Promise<string[]>;
  loadChildObjects(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject[]>;
  findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObject.Material.File>;
  // Learning Object Files
  addToFiles(params: {
    id: string;
    loFile: LearningObject.Material.File;
  }): Promise<void>;
  getLearningObjectMaterials(params: {
    id: string;
  }): Promise<LearningObject.Material>;
  removeFromFiles(params: { objectId: string; fileId: string }): Promise<void>;
  updateFileDescription(params: {
    learningObjectId: string;
    fileId: string;
    description: string;
  }): Promise<LearningObject.Material.File>;
  // Multipart Uploads
  insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void>;
  fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus>;
  updateMultipartUploadStatus(params: {
    id: string;
    completedPart: CompletedPart;
  }): Promise<void>;
  deleteMultipartUploadStatus(params: { id: string }): Promise<void>;
  addToCollection(learningObjectId: string, collection: string): Promise<void>;

  findUser(username: string): Promise<string>;
  fetchUser(id: string): Promise<User>;
  peek<T>(params: {
    query: { [index: string]: string };
    fields: { [index: string]: 0 | 1 };
  }): Promise<T>;
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
