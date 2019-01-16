import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../interfaces/interfaces';
import { LearningObject } from '@cyber4all/clark-entity';
// @ts-ignore
import * as stopword from 'stopword';
import { UserToken } from '../types';
import { LearningObjectQuery } from '../interfaces/DataStore';
import { DZFile, FileUpload } from '../interfaces/FileManager';
import { processMultipartUpload } from '../FileManager/FileInteractor';

// file size is in bytes
const MAX_PACKAGEABLE_FILE_SIZE = 100000000;

export class LearningObjectInteractor {
  /**
   * Loads Learning Object summaries for a user, optionally applying a query for filtering and sorting.
   * @async
   *
   * @returns {LearningObject[]} the user's learning objects found by the query
   * @param params.dataStore
   * @param params.library
   * @param params.username
   * @param params.accessUnpublished
   * @param params.loadChildren
   * @param params.query
   */
  public static async loadLearningObjectSummary(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    username: string;
    userToken: UserToken;
    accessUnpublished?: boolean;
    loadChildren?: boolean;
    query?: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    try {
      // Set accessUnpublished
      let accessUnpublished = params.accessUnpublished;

      // If accessUnpublished is unset, set equal to the result of the hasOwnership function
      if (accessUnpublished === undefined || accessUnpublished === null) {
        accessUnpublished = await this.hasOwnership({
          userToken: params.userToken,
          resourceVal: params.username,
          authFunction: (username: string, userToken: UserToken) => {
            return userToken.username === username;
          },
        });
      }

      let summary: LearningObject[] = [];

      // Perform search on objects
      if (params.query && Object.keys(params.query).length) {
        const level = params.query.level ? [...params.query.level] : undefined;
        const length = params.query.length
          ? [...params.query.length]
          : undefined;
        const status = params.query.status
          ? [...params.query.status]
          : undefined;
        const response = await this.searchObjects(
          params.dataStore,
          params.library,
          {
            name: params.query.name,
            author: params.username,
            collection: params.query.collection,
            status,
            length,
            level,
            standardOutcomeIDs: params.query.standardOutcomeIDs,
            text: params.query.text,
            accessUnpublished,
            orderBy: params.query.orderBy,
            sortType: params.query.sortType,
            currPage: params.query.page,
            limit: params.query.limit,
          },
        );
        summary = response.objects;
      } else {
        const objectIDs = await params.dataStore.getUserObjects(
          params.username,
        );
        summary = await params.dataStore.fetchMultipleObjects(
          objectIDs,
          false,
          accessUnpublished,
          params.query ? params.query.orderBy : null,
          params.query ? params.query.sortType : null,
        );
        // Load object metrics
        summary = await Promise.all(
          summary.map(async object => {
            try {
              object.metrics = await this.loadMetrics(
                params.library,
                object.id,
              );
              return object;
            } catch (e) {
              console.log(e);
              return object;
            }
          }),
        );
      }

      // Load children summaries
      if (params.loadChildren) {
        summary = await Promise.all(
          summary.map(async object => {
            if (object.children && object.children.length) {
              const children = await this.loadChildObjects(
                params.dataStore,
                params.library,
                object.id,
                false,
                accessUnpublished,
              );
              children.forEach((child: LearningObject) =>
                object.addChild(child),
              );
            }
            return object;
          }),
        );
      }

      return summary;
    } catch (e) {
      return Promise.reject(`Problem loading summary. Error: ${e}`);
    }
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
   * @param accessUnpublished
   */
  public static async loadLearningObject(
    dataStore: DataStore,
    library: LibraryCommunicator,
    username: string,
    learningObjectName: string,
    accessUnpublished?: boolean,
  ): Promise<LearningObject> {
    try {
      const fullChildren = false;
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );

      const learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        true,
        accessUnpublished,
      );

      const children = await this.loadChildObjects(
        dataStore,
        library,
        learningObject.id,
        fullChildren,
        accessUnpublished,
      );
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
   * Returns parent object's children
   *
   * @private
   * @static
   * @param {DataStore} dataStore
   * @param {LibraryCommunicator} library
   * @param {string} parentId
   * @param {boolean} [full]
   * @param {boolean} [accessUnreleased]
   * @returns {Promise<LearningObject[]>}
   * @memberof LearningObjectInteractor
   */
  private static async loadChildObjects(
    dataStore: DataStore,
    library: LibraryCommunicator,
    parentId: string,
    full?: boolean,
    accessUnreleased?: boolean,
  ): Promise<LearningObject[]> {
    // Load Parent's children
    const objects = await dataStore.loadChildObjects({
      id: parentId,
      full,
      accessUnreleased,
    });
    // For each child object
    return Promise.all(
      objects.map(async obj => {
        // Load their children
        const children = await this.loadChildObjects(
          dataStore,
          library,
          obj.id,
          full,
          accessUnreleased,
        );
        // For each of the Child's children
        await Promise.all(
          children.map(async child => {
            // Load child metrics
            try {
              child.metrics = await this.loadMetrics(library, child.id);
            } catch (e) {
              console.error(e);
            }
            // Add Child
            obj.addChild(child);
          }),
        );

        return obj;
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

  public static async loadFullLearningObjectByIDs(
    dataStore: DataStore,
    library: LibraryCommunicator,
    ids: string[],
  ): Promise<LearningObject[]> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(ids, true);

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
          } catch (e) {
            console.error(e);
          }
          const children = await this.loadChildObjects(
            dataStore,
            library,
            object.id,
            false,
            false,
          );
          children.forEach((child: LearningObject) => object.addChild(child));
          return object;
        }),
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem loading full LearningObject by ID. Error: ${e}`,
      );
    }
  }

  /**
   * Checks a learning object against submission criteria.
   *
   * @param object the learning object under question
   * @returns {string|null} An error message describing why the learning object isn't valid or null if it is.
   */
  static validateLearningObject(object: LearningObject): string {
    // TODO: Move to entity
    let error = null;
    if (object.name.trim() === '') {
      error = 'Learning Object name cannot be empty.';
    } else if (object.published && !object.outcomes.length) {
      error = 'Learning Object must have outcomes to submit for review.';
    } else if (object.published && !object.description) {
      error = 'Learning Object must have a description to submit for review.';
    }
    return error;
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

  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
    username: string,
    learningObjectNames: string[],
  ): Promise<void> {
    try {
      // Get LearningObject ids
      const objectRefs: {
        id: string;
        parentIds: string[];
      }[] = await Promise.all(
        learningObjectNames.map(async (name: string) => {
          const id = await dataStore.findLearningObject(username, name);
          const parentIds = await dataStore.findParentObjectIds({
            childId: id,
          });
          return { id, parentIds };
        }),
      );
      const objectIds = objectRefs.map(obj => obj.id);
      // Delete objects from datastore
      await dataStore.deleteMultipleLearningObjects(objectIds);
      // For each object id
      await Promise.all(
        objectRefs.map(async obj => {
          // Attempt to delete files
          try {
            const path = `${username}/${obj.id}/`;
            await fileManager.deleteAll({ path });
          } catch (error) {
            console.error(
              `Could not delete files for object ${obj.id}. ${error}`,
      );
      }
          // Update parents' dates
          await updateParentsDate({
            dataStore,
            parentIds: obj.parentIds,
            childId: obj.id,
            date: Date.now().toString(),
          });
        }),
      );
      // Remove objects from library
      await library.cleanObjectsFromLibraries(objectIds);
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Objects. Error: ${error}`,
      );
    }
  }

  /**
   * Fetch all Learning Objects in the system.
   * @returns {LearningObject[]} array of all objects
   */
  public static async fetchAllObjects(
    dataStore: DataStore,
    library: LibraryCommunicator,
    currPage: number,
    limit: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      const response = await dataStore.fetchAllObjects(false, currPage, limit);
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
      return { objects, total: response.total };
    } catch (e) {
      return Promise.reject(
        `Problem fetching all Learning Objects. Error: ${e}`,
      );
    }
  }

  /**
   * Returns array of learning objects associated with the given ids.
   * @returns {LearningObject[]} the Learning Objects for the supplied identifiers.
   */
  public static async fetchMultipleObjects(
    dataStore: DataStore,
    library: LibraryCommunicator,
    ids: { username: string; learningObjectName: string }[],
  ): Promise<LearningObject[]> {
    try {
      // Get IDs associated with LearningObjects
      const learningObjectIDs = await Promise.all(
        ids.map(id => {
          return new Promise<string>((resolve, reject) => {
            dataStore
              .findLearningObject(id.username, id.learningObjectName)
              .then(
                learningObjectID => resolve(learningObjectID),
                err => reject(err),
              );
          });
        }),
      );

      let learningObjects: LearningObject[] = await dataStore.fetchMultipleObjects(
        learningObjectIDs,
        false,
        true,
      );

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );
      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching multiple Learning Objects. Error: ${e}`,
      );
    }
  }

  public static async fetchObjectsByIDs(
    dataStore: DataStore,
    library: LibraryCommunicator,
    ids: string[],
  ): Promise<LearningObject[]> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(
        ids,
        true,
        true,
      );

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
            return object;
          } catch (e) {
            console.log(e);
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
   * Search for objects by name, author, length, level, and content.
   *
   * @param {string} params.name the objects' names should closely relate
   * @param {string} params.author the objects' authors' names` should closely relate
   * @param {string} params.length the objects' lengths should match exactly
   * @param {string} params.level the objects' levels should match exactly
   * @param {boolean} params.ascending whether or not result should be in ascending order
   *
   * @returns {Outcome[]} list of outcome suggestions, ordered by score
   */
  public static async searchObjects(
    dataStore: DataStore,
    library: LibraryCommunicator,
    params: {
      name: string;
      author: string;
      collection: string;
      status: string[];
      length: string[];
      level: string[];
      standardOutcomeIDs: string[];
      text: string;
      accessUnpublished?: boolean;
      orderBy?: string;
      sortType?: number;
      currPage?: number;
      limit?: number;
      released?: boolean;
    },
  ): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      if (params.text) {
        const firstChar = params.text.charAt(0);
        const lastChar = params.text.charAt(params.text.length - 1);
        if (firstChar !== `"` && lastChar !== `"`) {
          params.text = this.removeStopwords(params.text);
        }
      }

      const response = await dataStore.searchObjects({
        name: params.name,
        author: params.author,
        collection: params.collection,
        status: params.status,
        length: params.length,
        level: params.level,
        standardOutcomeIDs: params.standardOutcomeIDs,
        text: params.text,
        accessUnpublished: params.accessUnpublished,
        orderBy: params.orderBy,
        sortType: params.sortType,
        page: params.currPage,
        limit: params.limit,
        released: params.released,
      });

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
      return Promise.reject(`Problem suggesting Learning Objects. Error:${e}`);
    }
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

  public static async setChildren(params: {
    dataStore: DataStore;
    children: string[];
    username: string;
    parentName: string;
  }): Promise<void> {
    try {
      const parentID = await params.dataStore.findLearningObject(
        params.username,
        params.parentName,
      );
      await params.dataStore.setChildren(parentID, params.children);
      await updateObjectLastModifiedDate({
        dataStore: params.dataStore,
        id: parentID,
        date: Date.now().toString(),
      });
    } catch (e) {
      return Promise.reject(`Problem adding child. Error: ${e}`);
    }
  }

  public static async removeChild(params: {
    dataStore: DataStore;
    childId: string;
    username: string;
    parentName: string;
  }) {
    try {
      const parentID = await params.dataStore.findLearningObject(
        params.username,
        params.parentName,
      );
      return params.dataStore.deleteChild(parentID, params.childId);
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
  private static async hasOwnership(params: {
    userToken: UserToken;
    resourceVal: any;
    authFunction: (
      resourceVal: any,
      userToken: UserToken,
    ) => boolean | Promise<boolean>;
  }): Promise<boolean> {
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

    const learningObjectFile = {
      url,
      date,
      id: undefined,
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

    return learningObjectFile;
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
