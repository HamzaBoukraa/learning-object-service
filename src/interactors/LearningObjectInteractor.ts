import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../interfaces/interfaces';
import { LearningObject } from '@cyber4all/clark-entity';
import * as stopword from 'stopword';
import { LearningObjectQuery } from '../interfaces/DataStore';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';
import { File } from '@cyber4all/clark-entity/dist/learning-object';
import {
  MultipartFileUploadStatus,
  DZFile,
  FileUpload,
} from '../interfaces/FileManager';
import { Readable } from 'stream';
// TODO: Update File in clark-entity
export interface LearningObjectFile extends File {
  packageable: boolean;
}

// file size is in bytes
const MAX_PACKAGEABLE_FILE_SIZE = 100000000;

export class LearningObjectInteractor {
  /**
   * Load the scalar fields of a user's objects (ignore goals and outcomes).
   * @async
   *
   * @param {string} userid the user's login id
   *
   * @returns {User}
   */
  public static async loadLearningObjectSummary(params: {
    dataStore: DataStore;
    library: LibraryCommunicator;
    username: string;
    accessUnpublished?: boolean;
    loadChildren?: boolean;
    query?: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    try {
      let total = 0;
      let summary: LearningObject[] = [];
      if (
        params.query &&
        (params.query.name ||
          params.query.length ||
          params.query.level ||
          params.query.standardOutcomeIDs ||
          params.query.orderBy ||
          params.query.sortType ||
          params.query.collection ||
          params.query.status ||
          params.query.text)
      ) {
        const level = params.query.level
          ? Array.isArray(params.query.level)
            ? params.query.level
            : [params.query.level]
          : undefined;
        const length = params.query.length
          ? Array.isArray(params.query.length)
            ? params.query.length
            : [params.query.length]
          : undefined;
        const status = params.query.status
          ? Array.isArray(params.query.status)
            ? params.query.status
            : [params.query.status]
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
            accessUnpublished: params.accessUnpublished,
            orderBy: params.query.orderBy,
            sortType: params.query.sortType,
            currPage: params.query.page,
            limit: params.query.limit,
          },
        );
        summary = response.objects;
        total = response.total;
      } else {
        const objectIDs = await params.dataStore.getUserObjects(
          params.username,
        );
        summary = await params.dataStore.fetchMultipleObjects(
          objectIDs,
          false,
          params.accessUnpublished,
          params.query ? params.query.orderBy : null,
          params.query ? params.query.sortType : null,
        );
        total = summary.length;
      }

      if (params.loadChildren) {
        summary = await Promise.all(
          summary.map(async object => {
            if (object.children && object.children.length) {
              object.children = await this.loadChildObjects(
                params.dataStore,
                params.library,
                object,
                false,
                params.accessUnpublished,
              );
            }
            return object;
          }),
        );
      }

      summary = await Promise.all(
        summary.map(async object => {
          try {
            object.metrics = await this.loadMetrics(params.library, object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      return summary;
    } catch (e) {
      return Promise.reject(`Problem loading summary. Error: ${e}`);
    }
  }

  /**
   * Load a learning object and all its learning outcomes.
   * @async
   *
   * @param {UserID} author the author's database id
   * @param {string} name the learning object's identifying string
   *
   * @returns {LearningObject}
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

      learningObject.id = learningObjectID;

      if (learningObject.children) {
        learningObject.children = await this.loadChildObjects(
          dataStore,
          library,
          learningObject,
          fullChildren,
          accessUnpublished,
        );
      }

      try {
        learningObject.metrics = await this.loadMetrics(
          library,
          learningObjectID,
        );
      } catch (e) {
        console.log(e);
      }
      return learningObject;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  private static async loadChildObjects(
    dataStore: DataStore,
    library: LibraryCommunicator,
    learningObject: LearningObject,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject[]> {
    if (learningObject.children) {
      let children = await dataStore.fetchMultipleObjects(
        <string[]>learningObject.children,
        full,
        accessUnpublished,
      );

      children = await Promise.all(
        children.map(async object => {
          try {
            object.metrics = await this.loadMetrics(library, object.id);
            return object;
          } catch (e) {
            console.log(e);
            return object;
          }
        }),
      );

      for (let child of children) {
        child.children = await this.loadChildObjects(
          dataStore,
          library,
          child,
          full,
          accessUnpublished,
        );
      }
      return [...children];
    }
    return null;
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
            if (object.children && object.children.length) {
              object.children = await this.loadChildObjects(
                dataStore,
                library,
                object,
                false,
                false,
              );
            }
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
        `Problem loading full LearningObject by ID. Error: ${e}`,
      );
    }
  }

  static validateLearningObject(object: LearningObject): string {
    let error = null;
    if (object.name.trim() === '') {
      error = 'Learning Object name cannot be empty.';
    } else if (object.published && !object.outcomes.length) {
      error = 'Learning Object must have outcomes to publish.';
    } else if (object.published && !object.goals[0].text) {
      error = 'Learning Object must have a description to publish.';
    }
    return error;
  }

  /**
   * Uploads File and adds file metadata to LearningObject's materials
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     fileManager: FileManager;
   *     id: string;
   *     username: string;
   *     file: DZFile;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async uploadFile(params: {
    dataStore: DataStore;
    fileManager: FileManager;
    id: string;
    username: string;
    file: DZFile;
  }): Promise<LearningObjectFile> {
    try {
      let loFile: LearningObjectFile;
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
        await this.processMultipartUpload({
          dataStore: params.dataStore,
          fileManager: params.fileManager,
          id: params.id,
          file: params.file,
          fileUpload,
        });
      } else {
        // Regular upload
        const url = await params.fileManager.upload({ file: fileUpload });
        loFile = this.generateLearningObjectFile(params.file, url);
      }
      // If LearningObjectFile was generated, update LearningObject's materials
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
   * @param {{
   *     dataStore: DataStore;
   *     id: string;
   *     fileMeta: any;
   *     url: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async addFileMeta(params: {
    dataStore: DataStore;
    id: string;
    fileMeta: any;
    url: string;
  }): Promise<void> {
    try {
      let loFile: LearningObjectFile = this.generateLearningObjectFile(
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
   * Cancels multipart file upload
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     fileManager: FileManager;
   *     uploadStatusId: string;
   *     filePath: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async cancelUpload(params: {
    dataStore: DataStore;
    fileManager: FileManager;
    uploadStatusId: string;
  }): Promise<void> {
    try {
      const uploadStatus = await params.dataStore.fetchMultipartUploadStatus({
        id: params.uploadStatusId,
      });
      await this.abortMultipartUpload({
        uploadId: uploadStatus.uploadId,
        uploadStatusId: params.uploadStatusId,
        path: uploadStatus.path,
        fileManager: params.fileManager,
        dataStore: params.dataStore,
      });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(`Problem canceling upload. Error: ${e}`);
    }
  }

  public static async downloadSingleFile(params: {
    learningObjectId: string;
    fileId: string;
    dataStore: DataStore;
    fileManager: FileManager;
    author: string;
  }): Promise<{ filename: string; mimeType: string; stream: Readable }> {
    try {
      const [learningObject, fileMetaData] = await Promise.all([
        // Fetch the learning object
        params.dataStore.fetchLearningObject(params.learningObjectId),
        // Collect requested file metadata from datastore
        params.dataStore.findSingleFile({
          learningObjectId: params.learningObjectId,
          fileId: params.fileId,
        }),
      ]);

      const path = `${params.author}/${params.learningObjectId}/${
        fileMetaData.fullPath ? fileMetaData.fullPath : fileMetaData.name
      }`;
      const mimeType = fileMetaData.fileType;
      const stream = params.fileManager.streamFile({ path });
      return { mimeType, stream, filename: fileMetaData.name };
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Inserts metadata for file as LearningObjectFile
   *
   * @private
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     id: string;
   *     loFile: LearningObjectFile;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  private static async updateMaterials(params: {
    dataStore: DataStore;
    id: string;
    loFile: LearningObjectFile;
  }): Promise<void> {
    try {
      return await params.dataStore.addToFiles({
        id: params.id,
        loFile: params.loFile,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Processes Multipart Uploads
   *
   * @private
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     fileManager: FileManager;
   *     id: string;
   *     username: string;
   *     file: DZFile;
   *     fileUpload: FileUpload;
   *   }} params
   * @returns {Promise<LearningObjectFile>}
   * @memberof LearningObjectInteractor
   */
  private static async processMultipartUpload(params: {
    dataStore: DataStore;
    fileManager: FileManager;
    id: string;
    file: DZFile;
    fileUpload: FileUpload;
  }): Promise<LearningObjectFile> {
    let uploadId: string;
    try {
      const partNumber = +params.file.dzchunkindex + 1;
      // Fetch Upload Status
      const uploadStatus: MultipartFileUploadStatus = await params.dataStore.fetchMultipartUploadStatus(
        { id: params.file.dzuuid },
      );
      const completedPart = await params.fileManager.uploadPart({
        path: uploadStatus.path,
        data: params.fileUpload.data,
        partNumber,
        uploadId: uploadStatus.uploadId,
      });
      await params.dataStore.updateMultipartUploadStatus({
        completedPart,
        id: params.file.dzuuid,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Look up a learning outcome by its source and tag.
   * @async
   *
   * @param {LearningObjectID} source the object source's unique database id
   * @param {number} tag the outcome's unique identifier
   *
   * @returns {LearningOutcomeID}
   */
  public static async findLearningObject(
    dataStore: DataStore,
    username: string,
    learningObjectName: string,
  ): Promise<string> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      return learningObjectID;
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
      const learningObjectIDs: string[] = await Promise.all(
        learningObjectNames.map((name: string) => {
          return dataStore.findLearningObject(username, name);
        }),
      );
      await dataStore.deleteMultipleLearningObjects(learningObjectIDs);
      const learningObjectsWithFiles = await dataStore.fetchMultipleObjects(
        learningObjectIDs,
      );
      for (let object of learningObjectsWithFiles) {
        const path = `${username}/${object.id}/`;
        await fileManager.deleteAll({ path });
      }
      await library.cleanObjectsFromLibraries(learningObjectIDs);
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Objects. Error: ${error}`,
      );
    }
  }

  /**
   * Return literally all objects. Very expensive.
   * @returns {LearningObject[]} array of literally all objects
   */
  public static async fetchAllObjects(
    dataStore: DataStore,
    library: LibraryCommunicator,
    currPage: number,
    limit: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      const accessUnpublished = false;
      const response = await dataStore.fetchAllObjects(
        accessUnpublished,
        currPage,
        limit,
      );
      response.objects = await Promise.all(
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
      return response;
    } catch (e) {
      return Promise.reject(
        `Problem fetching all Learning Objects. Error: ${e}`,
      );
    }
  }

  /**
   * TODO: Refactor into fetchAllObjects. DRY
   * Returns array of learning objects associated with the given ids.
   * @returns {LearningObjectRecord[]}
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
   * @param {string} name the objects' names should closely relate
   * @param {string} author the objects' authors' names` should closely relate
   * @param {string} length the objects' lengths should match exactly
   * @param {string} level the objects' levels should match exactly TODO: implement
   * @param {boolean} ascending whether or not result should be in ascending order
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

      response.objects = await Promise.all(
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
      return response;
    } catch (e) {
      return Promise.reject(`Problem suggesting Learning Objects. Error:${e}`);
    }
  }

  public static async fetchCollections(dataStore: DataStore): Promise<any> {
    try {
      const collections = await dataStore.fetchCollections();
      return collections;
    } catch (e) {
      console.error(e);
      return Promise.reject(`Problem fetching collections. Error: ${e}`);
    }
  }

  public static async fetchCollection(
    dataStore: DataStore,
    name: string,
  ): Promise<any> {
    try {
      const collection = await dataStore.fetchCollection(name);
      return collection;
    } catch (e) {
      return Promise.reject(`Problem fetching collection. Error: ${e}`);
    }
  }

  public static async fetchCollectionMeta(
    dataStore: DataStore,
    name: string,
  ): Promise<any> {
    try {
      const collectionMeta = await dataStore.fetchCollectionMeta(name);
      return collectionMeta;
    } catch (e) {
      return Promise.reject(
        `Problem fetching collection metadata. Error: ${e}`,
      );
    }
  }

  public static async fetchCollectionObjects(
    dataStore: DataStore,
    name: string,
  ): Promise<any> {
    try {
      const objects = await dataStore.fetchCollectionObjects(name);
      return objects;
    } catch (e) {
      return Promise.reject(`Problem fetching collection objects. Error: ${e}`);
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
      return params.dataStore.setChildren(parentID, params.children);
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
   * Fetches Metrics for Learning Object
   *
   * @private
   * @static
   * @param {string} objectID
   * @returns {Promise<Metrics>}
   * @memberof LearningObjectInteractor
   */
  private static async loadMetrics(
    library: LibraryCommunicator,
    objectID: string,
  ): Promise<Metrics> {
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
   * @memberof SuggestionInteractor
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
   * Generates new LearningObjectFile Object
   *
   * @private
   * @param {any} file
   * @returns
   * @memberof S3Driver
   */
  private static generateLearningObjectFile(
    file: DZFile,
    url: string,
  ): LearningObjectFile {
    const extMatch = file.name.match(/(\.[^.]*$|$)/);
    const extension = extMatch ? extMatch[0] : '';
    const date = Date.now().toString();

    const learningObjectFile: LearningObjectFile = {
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
