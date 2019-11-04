import {
  LearningObjectSummary,
  CollectionAccessMap,
  ReleasedUserLearningObjectSearchQuery,
} from '../types';
import { LearningOutcomeDatastore } from '../../LearningOutcomes/datastores/LearningOutcomeDataStore';
import { LearningObjectStatDatastore } from '../../LearningObjectStats/LearningObjectStatsInteractor';
import { CollectionDataStore } from '../../Collections/CollectionDataStore';
import { ChangeLogDocument } from '../types/changelog';
import { LearningObject, User, Collection } from '../entity';
import { LearningObjectUpdates } from '../types/learning-object-updates';

export interface DataStore
  extends LearningOutcomeDatastore,
    LearningObjectStatDatastore,
    CollectionDataStore {
  /*
   * CREATE Operations
   */

  // LearningObjects
  insertLearningObject(object: LearningObject): Promise<string>;
  addToReleased(object: LearningObject): Promise<void>;

  // Changelog
  createChangelog(params: {
    cuid: string;
    author: {
      userId: string;
      name: string;
      role: string;
      profileImage: string;
    };
    changelogText: string;
  }): Promise<void>;
  fetchChangelogsBeforeDate(params: {
    cuid: string;
    date: string;
  }): Promise<ChangeLogDocument[]>;
  fetchAllChangelogs(params: {
    cuid: string;
  }): Promise<ChangeLogDocument[]>;
  fetchRecentChangelog(params: {
    cuid: string;
  }): Promise<ChangeLogDocument>;
  fetchRecentChangelogBeforeDate(params: {
    cuid: string;
    date: string;
  }): Promise<ChangeLogDocument>;
  deleteChangelog(params: { cuid: string }): Promise<void>;
  deleteChangelogsAfterRelease(params: { cuid: string, date: string }): Promise<void>;
  /*
   * READ Operations
   */

  // Learning Objects

  /**
   * Fetches file for released Learning Object by id
   *
   * @param {string} id [Id of the Learning Object]
   * @param {string} fileId [Id of the file]
   * @returns {Promise<LearningObject.Material.File[]>}
   * @memberof DataStore
   */
  fetchReleasedFile(params: {
    id: string;
    fileId: string;
  }): Promise<LearningObject.Material.File>;

  /**
   * Fetches files for released Learning Object
   *
   * @param {string} id [Id of the Learning Object]
   * @returns {Promise<LearningObject.Material.File[]>}
   * @memberof DataStore
   */
  fetchReleasedFiles(id: string): Promise<LearningObject.Material.File[]>;
  /**
   * Fetches materials for released Learning Object
   *
   * @param {string} id [Id of the Learning Object]
   * @returns {Promise<LearningObject.Material>}
   * @memberof DataStore
   */
  fetchReleasedMaterials(id: string): Promise<LearningObject.Material>;
  /**
   * Fetches summary of Learning Object by id and version number
   *
   * @param {string} id [Id of the LearningObject]
   * @param {number} version [The version number of the LearningObject]
   * @returns {Promise<LearningObjectSummary>}
   * @memberof DataStore
   */
  fetchLearningObjectRevision(params: {
    id: string;
    version: number;
    author?: User;
  }): Promise<LearningObjectSummary>;
  getUserObjects(username: string): Promise<string[]>;
  findLearningObject(params: {
    authorId: string;
    cuid: string;
    version?: number;
    status?: string;
  }): Promise<string>;
  findLearningObjectByName(params: {
    authorId: String;
    name: string;
    version?: number;
  }): Promise<string>;
  findReleasedLearningObject(params: {
    authorId: string;
    cuid: string;
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
    text?: string;
  }): Promise<LearningObject[]>;
  fetchLearningObjectStatus(id: string): Promise<string>;
  fetchLearningObjectCollection(id: string): Promise<string>;
  fetchLearningObjectAuthorUsername(id: string): Promise<string>;

  fetchParentObjects(params: {
    query: ParentLearningObjectQuery;
    full?: boolean;
  }): Promise<LearningObject[]>;
  fetchReleasedParentObjects(params: {
    query: ParentLearningObjectQuery;
    full?: boolean;
  }): Promise<LearningObject[]>;
  findParentObjectIds(params: { childId: string }): Promise<string[]>;
  findParentObjectId(params: { childId: string }): Promise<string>;
  findChildObjectIds(params: { parentId: string }): Promise<string[]>;

  /**
   * Loads released child Learning Objects for a working parent Learning Object
   *
   * @param {string} id [The id of the working parent Learning Object]
   * @param {boolean} full [Whether or not to load the full children Learning Objects]
   *
   * @returns {Promise<LearningObject[]>}
   */
  loadWorkingParentsReleasedChildObjects(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObjectSummary[]>;
  checkLearningObjectExistence(params: {
    learningObjectId?: string;
    cuid?: string;
    userId: string;
  }): Promise<LearningObject>;

  getLearningObjectMaterials(params: {
    id: string;
  }): Promise<LearningObject.Material>;

  // Users
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
  setChildren(parentId: string, children: string[]): Promise<void>;
  deleteChild(parentId: string, childId: string): Promise<void>;
  addToCollection(learningObjectId: string, collection: string): Promise<void>;

  fetchLearningObjectByCuid(cuid: string, version?: number): Promise<LearningObjectSummary[]>;
  fetchInternalLearningObjectByCuid(cuid: string, version?: number): Promise<LearningObject[]>;

  /*
   * DELETE Operations
   */

  // Learning Objects
  deleteLearningObject(id: string): Promise<void>;
  deleteMultipleLearningObjects(ids: string[]): Promise<void>;
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
  guidelines?: string[];
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
