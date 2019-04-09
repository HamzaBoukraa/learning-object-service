import { CompletedPart, MultipartFileUploadStatus } from './FileManager';
import { LearningObjectUpdates } from '../types';
import { LearningOutcomeDatastore } from '../LearningOutcomes/LearningOutcomeInteractor';
import { LearningObjectStatDatastore } from '../LearningObjectStats/LearningObjectStatsInteractor';
import { CollectionDataStore } from '../Collections/CollectionDataStore';
import { ChangeLogDocument } from '../types/changelog';
import { LearningObject, User, Collection } from '../entity';
import { Submission } from '../LearningObjectSubmission/types/Submission';

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
  addToReleased(object: LearningObject): Promise<void>;
  // File Uploads
  insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void>;

  // Changelog
  createChangelog(
    learningObjectId: string,
    userId: string,
    changelogText: string,
  ): Promise<void>;
  /*
   * READ Operations
   */

  // Learning Objects
  getUserObjects(username: string): Promise<string[]>;
  findLearningObject(params: {
    authorId: string;
    name: string;
  }): Promise<string>;
  findReleasedLearningObject(params: {
    authorId: string;
    name: string;
  }): Promise<string>;
  fetchLearningObject(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject>;
  fetchReleasedLearningObject(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject>;
  fetchMultipleObjects(params: {
    ids: string[];
    full?: boolean;
    collections?: string[];
    status: string[];
    orderBy?: string;
    sortType?: number;
  }): Promise<LearningObject[]>;
  fetchLearningObjectStatus(id: string): Promise<string>;
  fetchLearningObjectCollection(id: string): Promise<string>;
  fetchLearningObjectAuthorUsername(id: string): Promise<string>;
  searchReleasedObjects(
    params: ReleasedLearningObjectQuery,
  ): Promise<{ objects: LearningObject[]; total: number }>;
  searchAllObjects(
    params: LearningObjectQuery,
  ): Promise<{
    total: number;
    objects: LearningObject[];
  }>;
  fetchParentObjects(params: {
    query: ParentLearningObjectQuery;
    full?: boolean;
  }): Promise<LearningObject[]>;
  fetchReleasedParentObjects(params: {
    query: ParentLearningObjectQuery;
    full?: boolean;
  }): Promise<LearningObject[]>;
  findParentObjectIds(params: { childId: string }): Promise<string[]>;
  findChildObjectIds(params: { parentId: string }): Promise<string[]>;
  loadChildObjects(params: {
    id: string;
    full?: boolean;
    status: string[];
  }): Promise<LearningObject[]>;
  loadReleasedChildObjects(params: {
    id: string;
    full?: boolean;
    status: string[];
  }): Promise<LearningObject[]>;
  checkLearningObjectExistence(learningObjectId: string): Promise<string[]>;

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

  // Changelog
  fetchRecentChangelog(learningObjectId: string): Promise<ChangeLogDocument>;

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
  recordSubmission(submission: Submission): Promise<void>;
  fetchSubmission(collection: string, learningObjectId: string): Promise<Submission>;
  unsubmitLearningObject(id: string): Promise<void>;
  setChildren(parentId: string, children: string[]): Promise<void>;
  deleteChild(parentId: string, childId: string): Promise<void>;
  addToCollection(learningObjectId: string, collection: string): Promise<void>;

  // Materials
  addToFiles(params: {
    id: string;
    loFile: LearningObject.Material.File;
  }): Promise<string>;
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
  deleteMultipartUploadStatus(params: { id: string }): Promise<void>;

  // Changelog
  deleteChangelog(learningObjectId: string): Promise<void>;
}

export { Collection as LearningObjectCollection };

export interface Filters {
  orderBy?: string;
  sortType?: -1 | 1;
  page?: number;
  limit?: number;
}

export interface ReleasedLearningObjectQuery extends Filters {
  id?: string;
  name?: string;
  author?: string;
  length?: string[];
  level?: string[];
  standardOutcomeIDs?: string[];
  text?: string;
  full?: boolean;
  collection?: string[];
}

export interface LearningObjectQuery extends ReleasedLearningObjectQuery {
  status?: string[];
  conditions?: QueryCondition[];
}

export interface ParentLearningObjectQuery extends Filters {
  id: string;
  status?: string[];
  collections?: string[];
}

export interface QueryCondition {
  [index: string]: string | string[];
}
