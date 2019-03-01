// @ts-ignore
import * as stopword from 'stopword';
import { reportError } from '../drivers/SentryConnector';
import { processMultipartUpload } from '../FileManager/FileInteractor';
import { sanitizeObject, sanitizeText } from '../functions';
import { LearningObjectQuery, QueryCondition } from '../interfaces/DataStore';
import { DZFile, FileUpload } from '../interfaces/FileManager';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../interfaces/interfaces';
import {
  updateObjectLastModifiedDate,
  updateParentsDate,
} from '../LearningObjects/LearningObjectInteractor';
import { UserToken } from '../types';
import {
  getAccessGroupCollections,
  hasMultipleLearningObjectWriteAccesses,
  hasLearningObjectWriteAccess,
  isAdminOrEditor,
  isPrivilegedUser,
} from './AuthorizationManager';
import {
  ResourceError,
  ResourceErrorReason,
  ServiceError,
  ServiceErrorReason,
} from '../errors';
import { LearningObject } from '../entity';
import { accessGroups } from '../types/user-token';

// file size is in bytes
const MAX_PACKAGEABLE_FILE_SIZE = 100000000;

const LearningObjectState = {
  UNRELEASED: [
    LearningObject.Status.REJECTED,
    LearningObject.Status.UNRELEASED,
  ],
  IN_REVIEW: [
    LearningObject.Status.WAITING,
    LearningObject.Status.REVIEW,
    LearningObject.Status.PROOFING,
  ],
  RELEASED: [LearningObject.Status.RELEASED],
  ALL: [
    LearningObject.Status.REJECTED,
    LearningObject.Status.UNRELEASED,
    LearningObject.Status.WAITING,
    LearningObject.Status.REVIEW,
    LearningObject.Status.PROOFING,
    LearningObject.Status.RELEASED,
  ],
};

interface CollectionAccessMap {
  [index: string]: string[];
}

export class LearningObjectInteractor {
  /**
   * Loads Learning Object summaries for a user, optionally applying a query for filtering and sorting.
   * @async
   *
   * @returns {LearningObject[]} the user's learning objects found by the query
   * @param params.dataStore
   * @param params.library
   * @param params.username
   * @param params.userToken
   * @param params.loadChildren
   * @param params.query
   */
  public static async loadUsersObjectSummaries(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    username: string;
    userToken: UserToken;
    loadChildren?: boolean;
    query?: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    const {
      dataStore,
      library,
      username,
      userToken,
      loadChildren,
      query,
    } = params;
    try {
      let summary: LearningObject[] = [];

      // This will throw an error if there is no user with that username
      await dataStore.findUser(username);

      if (
        !this.hasReadAccess({
          userToken,
          resourceVal: params.username,
          authFunction: checkAuthByUsername,
        })
      ) {
        throw new ResourceError(
          'Invalid Access',
          ResourceErrorReason.INVALID_ACCESS,
        );
      }

      const formattedQuery = this.formatSearchQuery(query);
      let { status, orderBy, sortType } = formattedQuery;

      if (!status) {
        status = LearningObjectState.ALL;
      }

      const objectIDs = await dataStore.getUserObjects(username);
      summary = await dataStore.fetchMultipleObjects({
        ids: objectIDs,
        full: false,
        orderBy,
        sortType,
        status,
      });

      summary = await Promise.all(
        summary.map(async object => {
          // Load object metrics
          try {
            object.metrics = await this.loadMetrics(library, object.id);
          } catch (e) {
            console.log(e);
          }

          if (loadChildren) {
            const children = await this.loadChildObjects({
              dataStore,
              library,
              parentId: object.id,
              full: false,
              status: LearningObjectState.ALL,
              loadWorkingCopies: true,
            });
            children.forEach((child: LearningObject) => object.addChild(child));
          }

          return object;
        }),
      );
      return summary;
    } catch (e) {
      if (e instanceof ResourceError || e instanceof ServiceError) {
        return Promise.reject(e);
      }
      reportError(e);
      throw new ServiceError(ServiceErrorReason.INTERNAL);
    }
  }

  /**
   * Retrieve the objects on a user's profile based on the requester's access groups and priveleges
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     username: string;
   *     userToken?: UserToken;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof LearningObjectInteractor
   */
  public static async loadProfile(params: {
    dataStore: DataStore;
    username: string;
    userToken?: UserToken;
  }): Promise<LearningObject[]> {
    const { dataStore, username, userToken } = params;
    // all users can see released objects from all collections
    let status: string[] = LearningObjectState.RELEASED;
    let collections;

    // if user is admin/editor/curator/review, also send waiting/review/proofing objects for collections they're privileged in
    if (userToken && isAdminOrEditor(userToken.accessGroups)) {
      status = status.concat(LearningObjectState.IN_REVIEW);
    } else if (userToken && isPrivilegedUser(userToken.accessGroups)) {
      status = status.concat(LearningObjectState.IN_REVIEW);
      collections = getAccessGroupCollections(userToken);
    }

    const objectIDs = await dataStore.getUserObjects(username);
    const summaries = await dataStore.fetchMultipleObjects({
      ids: objectIDs,
      full: false,
      collections,
      status,
    });

    return summaries;
  }

  /**
   * Load a learning object and all its learning outcomes.
   * @async
   *
   *
   * @returns {LearningObject}
   * @param dataStore
   * @param library
   * @param username
   * @param learningObjectName
   * @param userToken
   */
  public static async loadLearningObject(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    username: string;
    learningObjectName: string;
    userToken?: UserToken;
    revision?: boolean;
  }): Promise<LearningObject> {
    try {
      let learningObject: LearningObject;

      let childrenStatus = LearningObjectState.RELEASED;
      let {
        dataStore,
        library,
        username,
        learningObjectName,
        userToken,
        revision,
      } = params;

      const fullChildren = false;
      let loadWorkingCopies = false;
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      if (!revision) {
        learningObject = await dataStore.fetchReleasedLearningObject({
          id: learningObjectID,
          full: true,
        });
      }
      if (revision || !learningObject) {
        learningObject = await this.loadWorkingObject({
          dataStore,
          learningObjectID,
          userToken,
          authorUsername: username,
        });
        if (LearningObjectState.IN_REVIEW.includes(learningObject.status)) {
          childrenStatus = [
            ...LearningObjectState.IN_REVIEW,
            ...LearningObjectState.RELEASED,
          ];
        }
        loadWorkingCopies = true;
      }

      if (!learningObject) {
        throw new ResourceError(
          `Learning Object ${learningObjectName} by ${username} does not exist.`,
          ResourceErrorReason.NOT_FOUND,
        );
      }

      const children = await this.loadChildObjects({
        dataStore,
        library,
        parentId: learningObject.id,
        full: fullChildren,
        status: childrenStatus,
        loadWorkingCopies,
      });
      children.forEach((child: LearningObject) =>
        learningObject.addChild(child),
      );

      try {
        learningObject.metrics = await this.loadMetrics(
          library,
          learningObjectID,
        );
      } catch (e) {
        console.error(e);
      }
      return learningObject;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetches the working copy of an object if authorized
   *
   * @private
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     learningObjectID: string;
   *     userToken: UserToken;
   *     authorUsername: string;
   *   }} params
   * @returns
   * @memberof LearningObjectInteractor
   */
  private static async loadWorkingObject(params: {
    dataStore: DataStore;
    learningObjectID: string;
    userToken: UserToken;
    authorUsername: string;
  }) {
    const { dataStore, learningObjectID, userToken, authorUsername } = params;
    const [status, collection] = await Promise.all([
      dataStore.fetchLearningObjectStatus(learningObjectID),
      dataStore.fetchLearningObjectCollection(learningObjectID),
    ]);
    this.authorizeReadAccess({
      userToken,
      objectInfo: { author: authorUsername, status, collection },
    });
    return dataStore.fetchLearningObject({
      id: learningObjectID,
      full: true,
    });
  }

  /**
   * Runs through authorization logic read access to a learning object.
   * Throws an error if user is not authorized
   *
   * @private
   * @static
   * @param {{
   *     userToken: UserToken;
   *     objectInfo: { author: string; status: string; collection: string };
   *   }} params
   * @memberof LearningObjectInteractor
   */
  private static authorizeReadAccess(params: {
    userToken: UserToken;
    objectInfo: { author: string; status: string; collection: string };
  }): void {
    const { userToken, objectInfo } = params;
    const authorOnlyAccess = LearningObjectState.UNRELEASED.includes(
      objectInfo.status as LearningObject.Status,
    );

    const isAuthor = this.hasReadAccess({
      userToken,
      resourceVal: objectInfo.author,
      authFunction: isAuthorByUsername,
    });
    if (authorOnlyAccess && !isAuthor) {
      throw new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    }
    const authorOrPrivilegedAccess = !LearningObjectState.RELEASED.includes(
      objectInfo.status as LearningObject.Status,
    );
    if (
      authorOrPrivilegedAccess &&
      !isAuthor &&
      !this.hasReadAccess({
        userToken,
        resourceVal: objectInfo.collection,
        authFunction: hasReadAccessByCollection,
      })
    ) {
      throw new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    }
  }

  /**
   * Returns parent object's children
   *
   * @private
   * @static
   * @param {DataStore} dataStore
   * @param {LibraryCommunicator} library
   * @param {string} parentId
   * @param {boolean} [full]
   * @param {string[]} [status]
   * @returns {Promise<LearningObject[]>}
   * @memberof LearningObjectInteractor
   */
  private static async loadChildObjects(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    parentId: string;
    full?: boolean;
    status: string[];
    loadWorkingCopies?: boolean;
  }): Promise<LearningObject[]> {
    const {
      dataStore,
      library,
      parentId,
      full,
      status,
      loadWorkingCopies,
    } = params;

    // Load Parent's children
    let objects;
    if (loadWorkingCopies) {
      objects = await dataStore.loadChildObjects({
        id: parentId,
        full,
        status,
      });
    } else {
      objects = await dataStore.loadReleasedChildObjects({
        id: parentId,
        full,
        status,
      });
    }

    // For each child object
    return Promise.all(
      objects.map(async obj => {
        // Load their children
        let children = await this.loadChildObjects({
          dataStore,
          library,
          parentId: obj.id,
          full,
          status,
          loadWorkingCopies,
        });
        // For each of the Child's children
        children = await Promise.all(
          children.map(async child => {
            // Load child metrics
            try {
              child.metrics = await this.loadMetrics(library, child.id);
            } catch (e) {
              console.error(e);
            }
            return child;
          }),
        );

        return new LearningObject({ ...obj.toPlainObject(), children });
      }),
    );
  }

  public static async fetchParents(params: {
    dataStore: DataStore;
    query: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    try {
      return await params.dataStore.findParentObjects({
        query: params.query,
      });
    } catch (e) {
      console.log(e);
      return Promise.reject(
        `Problem fetching parent objects for ${params.query.id}. Error: ${e}`,
      );
    }
  }

  /**
   * Uploads a file and adds its metadata to the LearningObject's materials.
   *
   * @static
   * @param {{
   *     dataStore: DataStore,
   *     fileManager: FileManager,
   *     id: string,
   *     username: string,
   *     file: DZFile
   *   }} params
   * @returns {Promise<LearningObject.Material.File>}
   */
  public static async uploadFile(params: {
    dataStore: DataStore;
    fileManager: FileManager;
    id: string;
    username: string;
    file: DZFile;
    uploadId: string;
  }): Promise<LearningObject.Material.File> {
    try {
      let loFile: LearningObject.Material.File;
      const uploadPath = `${params.username}/${params.id}/${
        params.file.fullPath ? params.file.fullPath : params.file.name
        }`;
      const fileUpload: FileUpload = {
        path: uploadPath,
        data: params.file.buffer,
      };
      const hasChunks = +params.file.dztotalchunkcount;
      if (hasChunks) {
        // Process Multipart
        await processMultipartUpload({
          dataStore: params.dataStore,
          fileManager: params.fileManager,
          file: params.file,
          uploadId: params.uploadId,
          fileUpload,
        });
      } else {
        // Regular upload
        const url = await params.fileManager.upload({ file: fileUpload });
        loFile = this.generateLearningObjectFile(params.file, url);
      }
      // If LearningObject.Material.File was generated, update LearningObject's materials
      if (loFile) {
        // FIXME should be implemented in clark entity
        // @ts-ignore
        loFile.size = params.file.size;
        await this.updateMaterials({
          loFile,
          dataStore: params.dataStore,
          id: params.id,
        });
      }
      return loFile;
    } catch (e) {
      return Promise.reject(`Problem uploading file. Error: ${e}`);
    }
  }

  /**
   * Adds File metadata to Learning Object materials
   *
   * @static
   * @param {DataStore} params.dataStore
   * @param {string} params.id the Learning Object identifier.
   * @param params.fileMeta the file metadata.
   * @param {string} params.url the URL for accessing the file.
   * @returns {Promise<void>}
   */
  public static async addFileMeta(params: {
    dataStore: DataStore;
    id: string;
    fileMeta: any;
    url: string;
  }): Promise<void> {
    try {
      let loFile: LearningObject.Material.File = this.generateLearningObjectFile(
        params.fileMeta,
        params.url,
      );
      await this.updateMaterials({
        loFile,
        dataStore: params.dataStore,
        id: params.id,
      });
    } catch (e) {
      return Promise.reject(`Problem uploading file. Error: ${e}`);
    }
  }

  /**
   * Inserts metadata for file as LearningObject.Material.File
   *
   * @private
   * @static
   * @param {{
   *     dataStore: DataStore,
   *     id: string,
   *     loFile: LearningObject.Material.File,
   *   }} params
   * @returns {Promise<void>}
   */
  private static async updateMaterials(params: {
    dataStore: DataStore;
    id: string;
    loFile: LearningObject.Material.File;
  }): Promise<void> {
    try {
      await params.dataStore.addToFiles({
        id: params.id,
        loFile: params.loFile,
      });
      await updateObjectLastModifiedDate({
        dataStore: params.dataStore,
        id: params.id,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Look up a Learning Object by its name and the user that created it.
   * @async
   *
   * @param dataStore the data store to be accessed
   * @param {string} username the username of the creator
   * @param {string} learningObjectName the name of the Learning Object
   *
   * @returns {string} LearningOutcomeID
   */
  public static async findLearningObject(
    dataStore: DataStore,
    username: string,
    learningObjectName: string,
  ): Promise<string> {
    try {
      return await dataStore.findLearningObject(username, learningObjectName);
    } catch (e) {
      return Promise.reject(`Problem finding LearningObject. Error: ${e}`);
    }
  }

  public static async deleteMultipleLearningObjects(params: {
    dataStore: DataStore;
    fileManager: FileManager;
    library: LibraryCommunicator;
    learningObjectNames: string[];
    user: UserToken;
  }): Promise<void> {
    try {
      const hasAccess = await hasMultipleLearningObjectWriteAccesses(
        params.user,
        params.dataStore,
        params.learningObjectNames,
      );
      if (hasAccess) {
        // Get LearningObject ids
        const objectRefs: {
          id: string;
          parentIds: string[];
        }[] = await Promise.all(
          params.learningObjectNames.map(async (name: string) => {
            const id = await params.dataStore.findLearningObject(
              params.user.username,
              name,
            );
            const parentIds = await params.dataStore.findParentObjectIds({
              childId: id,
            });
            return { id, parentIds };
          }),
        );
        const objectIds = objectRefs.map(obj => obj.id);
        // Remove objects from library
        await params.library.cleanObjectsFromLibraries(objectIds);
        // Delete objects from datastore
        await params.dataStore.deleteMultipleLearningObjects(objectIds);
        // For each object id
        objectRefs.forEach(async obj => {
          // Attempt to delete files
          const path = `${params.user.username}/${obj.id}/`;
          params.fileManager.deleteAll({ path }).catch(e => {
            console.error(`Problem deleting files at ${path}. ${e}`);
          });
          // Update parents' dates
          updateParentsDate({
            dataStore: params.dataStore,
            parentIds: obj.parentIds,
            childId: obj.id,
            date: Date.now().toString(),
          });
        });
      } else {
        return Promise.reject(
          new Error('User does not have authorization to perform this action'),
        );
      }
    } catch (error) {
      reportError(error);
      return Promise.reject(
        new Error(`Problem deleting Learning Objects. Error: ${error}`),
      );
    }
  }

  /**
   * Fetches objects by id
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     library: LibraryCommunicator;
   *     ids: string[];
   *     full?: boolean;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof LearningObjectInteractor
   */
  public static async fetchObjectsByIDs(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    ids: string[];
    full?: boolean;
  }): Promise<LearningObject[]> {
    try {
      const { dataStore, library, ids, full } = params;
      let learningObjects = await dataStore.fetchMultipleObjects({
        ids,
        full,
        status: [
          ...LearningObjectState.IN_REVIEW,
          ...LearningObjectState.RELEASED,
        ],
      });

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
            return object;
          } catch (e) {
            console.log(e);
            if (!full) {
              return object;
            }
          }
          if (full) {
            const children = await this.loadChildObjects({
              dataStore,
              library,
              parentId: object.id,
              full: true,
              status: [
                ...LearningObjectState.IN_REVIEW,
                ...LearningObjectState.RELEASED,
              ],
            });
            children.forEach((child: LearningObject) => object.addChild(child));
            return object;
          }
        }),
      );
      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching LearningObjects by ID. Error: ${e}`,
      );
    }
  }

  /**
   * Searches LearningObjects based on query
   *
   * @static
   * @param {DataStore} dataStore
   * @param {LibraryCommunicator} library
   * @param {LearningObjectQuery} query
   * @param {UserToken} userToken
   * @returns {Promise<{ total: number; objects: LearningObject[] }>}
   * @memberof LearningObjectInteractor
   */
  public static async searchObjects(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    query: LearningObjectQuery;
    userToken: UserToken;
  }): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      const { dataStore, library, query, userToken } = params;
      let {
        name,
        author,
        collection,
        length,
        level,
        standardOutcomeIDs,
        text,
        orderBy,
        sortType,
        page,
        limit,
        status,
      } = this.formatSearchQuery(query);
      let response: { total: number; objects: LearningObject[] };

      if (userToken && isPrivilegedUser(userToken.accessGroups)) {
        let conditions: QueryCondition[];
        if (!isAdminOrEditor(userToken.accessGroups)) {
          const privilegedCollections = getAccessGroupCollections(userToken);
          const collectionAccessMap = getCollectionAccessMap(
            collection,
            privilegedCollections,
            status,
          );
          const requestedCollections = collection && collection.length > 0;
          conditions = this.buildCollectionQueryConditions({
            requestedCollections,
            requestedStatuses: status,
            collectionAccessMap,
          });
          collection = null;
          status = null;
        } else {
          status = this.getAuthAdminEditorStatuses(status);
        }

        response = await dataStore.searchAllObjects({
          name,
          author,
          collection,
          length,
          level,
          standardOutcomeIDs,
          text,
          status,
          conditions,
          orderBy,
          sortType,
          page,
          limit,
        });
      } else {
        response = await dataStore.searchReleasedObjects({
          name,
          author,
          collection,
          length,
          level,
          standardOutcomeIDs,
          text,
          orderBy,
          sortType,
          page,
          limit,
        });
      }

      const objects = await Promise.all(
        response.objects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return { total: response.total, objects };
    } catch (e) {
      if (e instanceof ResourceError || e instanceof ServiceError) {
        return Promise.reject(e);
      }
      reportError(e);
      throw new ServiceError(ServiceErrorReason.INTERNAL);
    }
  }

  /**
   * Builds QueryConditions based on requested collections and collectionAccessMap
   *
   * @private
   * @static
   * @param {boolean} requestedCollections [Represents whether or not specific collections were requested]
   * @param {string[]} requestedStatuses [Array of requested statuses]
   * @param {CollectionAccessMap} collectionAccessMap
   * @returns {QueryCondition[]}
   * @memberof LearningObjectInteractor
   */
  private static buildCollectionQueryConditions(params: {
    requestedCollections: boolean;
    requestedStatuses: string[];
    collectionAccessMap: CollectionAccessMap;
  }): QueryCondition[] {
    const {
      requestedCollections,
      requestedStatuses,
      collectionAccessMap,
    } = params;
    const conditions: QueryCondition[] = [];
    if (!requestedCollections) {
      if (
        !requestedStatuses ||
        (requestedStatuses &&
          requestedStatuses.length === 1 &&
          requestedStatuses[0] === LearningObject.Status.RELEASED)
      ) {
        conditions.push({
          status: LearningObject.Status.RELEASED,
        });
      }
    }

    const mapKeys = Object.keys(collectionAccessMap);
    for (const key of mapKeys) {
      const status = collectionAccessMap[key];
      conditions.push({ collection: key, status });
    }
    return conditions;
  }

  /**
   * Returns statuses admin and editors have access to. Throws an error if  unauthorized statuses are requested
   *
   * @private
   * @static
   * @param {string[]} status [Array of requested statuses]
   * @returns
   * @memberof LearningObjectInteractor
   */
  private static getAuthAdminEditorStatuses(status?: string[]): string[] {
    if (!status || (status && !status.length)) {
      return [
        ...LearningObjectState.IN_REVIEW,
        ...LearningObjectState.RELEASED,
      ];
    }

    if (
      status.includes(LearningObject.Status.REJECTED) ||
      status.includes(LearningObject.Status.UNRELEASED)
    ) {
      throw new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    }

    return status;
  }

  /**
   * Formats search query to verify params are the appropriate types
   *
   * @private
   * @static
   * @param {LearningObjectQuery} query
   * @returns {LearningObjectQuery}
   * @memberof LearningObjectInteractor
   */
  private static formatSearchQuery(
    query: LearningObjectQuery,
  ): LearningObjectQuery {
    const formattedQuery = { ...query };
    formattedQuery.text = sanitizeText(formattedQuery.text) || null;
    formattedQuery.orderBy =
      sanitizeText(formattedQuery.orderBy, false) || null;
    formattedQuery.status = toArray(formattedQuery.status);
    formattedQuery.length = toArray(formattedQuery.length);
    formattedQuery.level = toArray(formattedQuery.level);
    formattedQuery.collection = toArray(formattedQuery.collection);
    formattedQuery.standardOutcomeIDs = toArray(
      formattedQuery.standardOutcomeIDs,
    );
    formattedQuery.page = toNumber(formattedQuery.page);
    formattedQuery.limit = toNumber(formattedQuery.limit);
    formattedQuery.sortType = <1 | -1>toNumber(formattedQuery.sortType);
    formattedQuery.sortType =
      formattedQuery.sortType === 1 || formattedQuery.sortType === -1
        ? formattedQuery.sortType
        : 1;

    if (formattedQuery.text) {
      const firstChar = formattedQuery.text.charAt(0);
      const lastChar = formattedQuery.text.charAt(
        formattedQuery.text.length - 1,
      );
      if (firstChar !== `"` && lastChar !== `"`) {
        formattedQuery.text = this.removeStopwords(formattedQuery.text);
      }
    }

    return sanitizeObject({ object: formattedQuery }, false);
  }

  public static async addToCollection(
    dataStore: DataStore,
    learningObjectId: string,
    collection: string,
  ): Promise<void> {
    try {
      await dataStore.addToCollection(learningObjectId, collection);
    } catch (e) {
      console.log(e);
      return Promise.reject(e);
    }
  }

  /**
   * Sets children of parent object after fetching the ID of the object and authenticating user as privelaged or Author
   *
   * @param {DataStore} dataStore
   * @param {string[]} children - array of children IDs to be added
   * @param {string} parentName
   * @param {string } username - author's username
   * @param {UserToken} userToken - user's token with access privelages
   *
   */
  public static async setChildren(params: {
    dataStore: DataStore;
    children: string[];
    parentName: string;
    username: string;
    userToken: UserToken;
  }): Promise<void> {
    const { dataStore, children, username, parentName, userToken } = params;

    try {
      const parentID = await dataStore.findLearningObject(
        username,
        parentName,
      );

      const hasAccess = await hasLearningObjectWriteAccess(userToken, dataStore, parentID);

      if (hasAccess) {
        await dataStore.setChildren(parentID, children);

        await updateObjectLastModifiedDate({
          dataStore,
          id: parentID,
          date: Date.now().toString(),
        });
      } else {
        throw new ResourceError(
          'Invalid Access',
          ResourceErrorReason.INVALID_ACCESS,
        );
      }


    } catch (e) {
      return Promise.reject(`Problem adding child. Error: ${e}`);
    }
  }

  /**
   * Removes child of parent object after fetching the ID of the object and authenticating user as privelaged or Author
   *
   * @param {DataStore} dataStore
   * @param {string} childId
   * @param {string} parentName
   * @param {string } username - author's username
   * @param {UserToken} userToken - user's token with access privelages.
   *
   */
  public static async removeChild(params: {
    dataStore: DataStore;
    childId: string;
    parentName: string;
    username: string;
    userToken: UserToken;
  }) {
    const { dataStore, childId, username, parentName, userToken } = params;
    try {
      const parentID = await dataStore.findLearningObject(
        username,
        parentName,
      );

      const hasAccess = await hasLearningObjectWriteAccess(userToken, dataStore, parentID);

      if (hasAccess) {
        await dataStore.deleteChild(parentID, childId);

        await updateObjectLastModifiedDate({
          dataStore,
          id: parentID,
          date: Date.now().toString(),
        });
      } else {
        throw new ResourceError(
          'Invalid Access',
          ResourceErrorReason.INVALID_ACCESS,
        );
      }

    } catch (e) {
      return Promise.reject(`Problem removing child. Error: ${e}`);
    }
  }

  /**
   * Uses passed authorization function to check if user has access to a resource
   *
   * @private
   * @static
   * @param {UserToken} params.userToken [Object containing information about the user requesting the resource]
   * @param {any} params.resourceVal [Resource value to run auth function against]
   * @param {Function} params.authFunction [Function used to check if user has ownership over resource]
   * @returns {Promise<boolean>}
   * @memberof LearningObjectInteractor
   */
  private static hasReadAccess(params: {
    userToken: UserToken;
    resourceVal: any;
    authFunction: (
      resourceVal: any,
      userToken: UserToken,
    ) => boolean | Promise<boolean>;
  }): boolean | Promise<boolean> {
    if (!params.userToken) {
      return false;
    }
    return params.authFunction(params.resourceVal, params.userToken);
  }
  /**
   * Fetches Metrics for Learning Object
   *
   * @private
   * @static
   * @param library the gateway to library data
   * @param {string} objectID
   * @returns {Promise<LearningObject.Metrics>}
   */
  private static async loadMetrics(
    library: LibraryCommunicator,
    objectID: string,
  ): Promise<LearningObject.Metrics> {
    try {
      return library.getMetrics(objectID);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Returns string without stopwords
   *
   * @private
   * @static
   * @param {string} text
   * @returns {string}
   */
  private static removeStopwords(text: string): string {
    const oldString = text.split(' ');
    text = stopword
      .removeStopwords(oldString)
      .join(' ')
      .trim();
    return text;
  }

  /**
   * Generates new LearningObject.Material.File Object
   *
   * @private
   * @param {DZFile} file
   * @param {string} url
   * @returns
   */
  private static generateLearningObjectFile(
    file: DZFile,
    url: string,
  ): LearningObject.Material.File {
    const extMatch = file.name.match(/(\.[^.]*$|$)/);
    const extension = extMatch ? extMatch[0] : '';
    const date = Date.now().toString();

    const learningObjectFile: Partial<LearningObject.Material.File> = {
      url,
      date,
      name: file.name,
      fileType: file.mimetype,
      extension: extension,
      fullPath: file.fullPath,
      size: file.dztotalfilesize ? file.dztotalfilesize : file.size,
      packageable: this.isPackageable(file),
    };

    // Sanitize object. Remove undefined or null values
    const keys = Object.keys(learningObjectFile);
    for (const key of keys) {
      const prop = learningObjectFile[key];
      if (!prop && prop !== 0) {
        delete learningObjectFile[key];
      }
    }

    return learningObjectFile as LearningObject.Material.File;
  }

  private static isPackageable(file: DZFile) {
    // if dztotalfilesize doesn't exist it must not be a chunk upload.
    // this means by default it must be a packageable file size
    return !(file.dztotalfilesize > MAX_PACKAGEABLE_FILE_SIZE);
  }
}

/**
 * Replaces illegal file path characters with '_'.
 * Truncates string if longer than file path's legal max length of 250 (Windows constraint was said to be somewhere between 247-260);
 * .zip extension will make the max length go to 254 which is still within the legal range
 *
 * @export
 * @param {string} name
 * @returns {string}
 */
const MAX_CHAR = 250;
export function sanitizeFileName(name: string): string {
  let clean = name.replace(/[\\/:"*?<>|]/gi, '_');
  if (clean.length > MAX_CHAR) {
    clean = clean.slice(0, MAX_CHAR);
  }
  return clean;
}

/**
 * Returns new array with element(s) from value param or undefined if value was not defined
 *
 * @template T
 * @param {*} value
 * @returns {T[]}
 */
function toArray<T>(value: any): T[] {
  if (value == null || value === '') {
    return null;
  }
  if (value && Array.isArray(value)) {
    return [...value].filter(v => !isEmptyValue(v));
  }
  return [value].filter(v => !isEmptyValue(v));
}

function isEmptyValue(value: any): boolean {
  if (value == null || value === '') {
    return true;
  }
  if (typeof value === 'string') {
    return sanitizeText(value) === '';
  }
  return false;
}

/**
 *
 * Converts non-number value to number if defined else returns null
 * @param {*} value
 * @returns {number}
 */
function toNumber(value: any): number {
  const num = parseInt(`${value}`, 10);
  if (!isNaN(num)) {
    return +value;
  }
  return null;
}

/**
 * Returns Map of collections to statuses representing read access privilege over associated collection
 *
 * @param {string[]} requestedCollections
 * @param {string[]} privilegedCollections
 * @returns CollectionAccessMap
 */
function getCollectionAccessMap(
  requestedCollections: string[],
  privilegedCollections: string[],
  requestedStatuses: string[],
): CollectionAccessMap {
  if (
    requestedStatuses &&
    (requestedStatuses.includes(LearningObject.Status.REJECTED) ||
      requestedStatuses.includes(LearningObject.Status.UNRELEASED))
  ) {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  const accessMap = {};
  const authStatuses =
    requestedStatuses && requestedStatuses.length
      ? requestedStatuses
      : [...LearningObjectState.IN_REVIEW, ...LearningObjectState.RELEASED];

  if (requestedCollections && requestedCollections.length) {
    for (const filter of requestedCollections) {
      if (privilegedCollections.includes(filter)) {
        accessMap[filter] = authStatuses;
      } else {
        accessMap[filter] = LearningObjectState.RELEASED;
      }
    }
  } else {
    for (const collection of privilegedCollections) {
      accessMap[collection] = authStatuses;
    }
  }

  return accessMap;
}

/**
 * Checks if requester is admin or username matches the username provided
 *
 * @param {string} username
 * @param {UserToken} userToken
 * @returns
 */
const checkAuthByUsername = (username: string, userToken: UserToken) => {
  return (
    isAdminOrEditor(userToken.accessGroups) || userToken.username === username
  );
};

/**
 * Checks if requester is author byu the username provided
 *
 * @param {string} username
 * @param {UserToken} userToken
 * @returns
 */
const isAuthorByUsername = (username: string, userToken: UserToken) => {
  return userToken.username === username;
};

/**
 * Checks if user has authorization based on collection
 *
 * @param {string} collectionName
 * @param {UserToken} userToken
 * @returns
 */
const hasReadAccessByCollection = (
  collectionName: string,
  userToken: UserToken,
) => {
  if (!isPrivilegedUser(userToken.accessGroups)) return false;
  return (
    isAdminOrEditor(userToken.accessGroups) ||
    getAccessGroupCollections(userToken).includes(collectionName)
  );
};
