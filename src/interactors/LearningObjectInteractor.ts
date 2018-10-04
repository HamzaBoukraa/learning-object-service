import { DataStore, FileManager, Responder } from '../interfaces/interfaces';
import { LearningObject } from '@cyber4all/clark-entity';
import * as stopword from 'stopword';
import * as https from 'https';
import { LearningObjectQuery } from '../interfaces/DataStore';
import {
  Metrics,
} from '@cyber4all/clark-entity/dist/learning-object';
import { LibraryInteractor } from './LibraryInteractor';
import { File } from '@cyber4all/clark-entity/dist/learning-object';
import {
  MultipartFileUpload,
  MultipartFileUploadStatus,
  MultipartFileUploadStatusUpdates,
  DZFile,
  FileUpload,
  MultipartUploadData,
  CompletedPartList,
} from '../interfaces/FileManager';
import { generatePDF } from '../LearningObjects/PDFKitDriver';
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
  public static async loadLearningObjectSummary(
    dataStore: DataStore,
    username: string,
    accessUnpublished?: boolean,
    loadChildren?: boolean,
    query?: LearningObjectQuery,
  ): Promise<LearningObject[]> {
    try {
      let total = 0;
      let summary: LearningObject[] = [];
      if (
        query &&
        (query.name ||
          query.length ||
          query.level ||
          query.standardOutcomeIDs ||
          query.text)
      ) {
        const response = await this.searchObjects(
          dataStore,
          query.name,
          username,
          query.length,
          query.level,
          query.standardOutcomeIDs,
          query.text,
          accessUnpublished,
          query.orderBy,
          query.sortType,
          query.page,
          query.limit,
        );
        summary = response.objects;
        total = response.total;
      } else {
        const objectIDs = await dataStore.getUserObjects(username);
        summary = await dataStore.fetchMultipleObjects(
          objectIDs,
          false,
          accessUnpublished,
          query ? query.orderBy : null,
          query ? query.sortType : null,
        );
        total = summary.length;
      }

      if (loadChildren) {
        summary = await Promise.all(
          summary.map(async object => {
            if (object.children && object.children.length) {
              object.children = await this.loadChildObjects(
                dataStore,
                object,
                false,
                accessUnpublished,
              );
            }
            return object;
          }),
        );
      }

      summary = await Promise.all(
        summary.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
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
          learningObject,
          fullChildren,
          accessUnpublished,
        );
      }

      try {
        learningObject.metrics = await this.loadMetrics(learningObjectID);
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
            object.metrics = await this.loadMetrics(object.id);
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
    ids: string[],
  ): Promise<LearningObject[]> {
    try {
      let learningObjects = await dataStore.fetchMultipleObjects(ids, true);

      learningObjects = await Promise.all(
        learningObjects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
            if (object.children && object.children.length) {
              object.children = await this.loadChildObjects(
                dataStore,
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
        loFile = await this.processMultipartUpload({
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
    responder: Responder;
  }): Promise<any> {
    try {
      // Collect requested file metadata from datastore
      const fileMetaData = await params.dataStore.findSingleFile({
        learningObjectId: params.learningObjectId,
        fileId: params.fileId,
      });

      const url = fileMetaData.url;

      // Make http request using attached url in file metadata, pipe response
      // tslint:disable-next-line:max-line-length
      https.get(url, res => {
        res.pipe(
          params.responder.writeStream(
            `${fileMetaData.name}.${
              fileMetaData.extension ? fileMetaData.extension : ''
            }`,
          ),
        );
      });
    } catch (e) {
      Promise.reject(e);
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
      let finish = false;
      let completedPartList: CompletedPartList;
      if (uploadStatus) {
        uploadId = uploadStatus.uploadId;
        finish = uploadStatus.partsUploaded + 1 === uploadStatus.totalParts;
        completedPartList = uploadStatus.completedParts;
      }
      // Create MultipartFileUpload
      const multipartFileUpload: MultipartFileUpload = {
        ...params.fileUpload,
        partNumber,
        uploadId,
      };
      // Upload Chunk
      const multipartData = await params.fileManager.processMultipart({
        finish,
        completedPartList,
        file: multipartFileUpload,
      });
      if (!finish) {
        if (uploadStatus) {
          await this.updateUploadStatus({
            dataStore: params.dataStore,
            file: params.file,
            uploadStatus,
            multipartData,
          });
        } else {
          uploadId = multipartData.uploadId;
          await this.createUploadStatus({
            dataStore: params.dataStore,
            file: params.file,
            multipartData,
          });
        }
      } else {
        const loFile = this.generateLearningObjectFile(
          params.file,
          multipartData.url,
        );
        // Delete upload data
        params.dataStore.deleteMultipartUploadStatus({
          id: uploadStatus._id,
        });
        return loFile;
      }
    } catch (e) {
      this.abortMultipartUpload({
        uploadId,
        fileManager: params.fileManager,
        dataStore: params.dataStore,
        uploadStatusId: params.file.dzuuid,
        path: params.file.fullPath ? params.file.fullPath : params.file.name,
      });
      return Promise.reject(e);
    }
  }

  /**
   * Aborts multipart upload operation and deletes UploadStatus from DB
   *
   * @private
   * @static
   * @param {{
   *     uploadId: string;
   *     uploadStatusID: string;
   *     path: string;
   *     fileManager: FileManager;
   *     dataStore: DataStore;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  private static async abortMultipartUpload(params: {
    uploadId: string;
    uploadStatusId: string;
    path: string;
    fileManager: FileManager;
    dataStore: DataStore;
  }): Promise<void> {
    try {
      await params.fileManager.cancelMultipart({
        path: params.path,
        uploadId: params.uploadId,
      });
      return await params.dataStore.deleteMultipartUploadStatus({
        id: params.uploadStatusId,
      });
    } catch (e) {
      console.log(`Problem  aborting multipart upload. Error: ${e}`);
      return Promise.reject(e);
    }
  }

  /**
   *
   * Creates new UploadStatus
   * @private
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     file: DZFile;
   *     multipartData: MultipartUploadData;
   *   }} params
   * @returns Promise<void>
   * @memberof LearningObjectInteractor
   */
  private static async createUploadStatus(params: {
    dataStore: DataStore;
    file: DZFile;
    multipartData: MultipartUploadData;
  }): Promise<void> {
    try {
      const uploadStatus: MultipartFileUploadStatus = {
        _id: params.file.dzuuid,
        uploadId: params.multipartData.uploadId,
        totalParts: +params.file.dztotalchunkcount,
        partsUploaded: 1,
        fileSize: +params.file.size,
        path: params.file.fullPath ? params.file.fullPath : params.file.name,
        bytesUploaded: +params.file.dzchunksize,
        completedParts: [params.multipartData.completedPart],
        createdAt: Date.now().toString(),
      };
      return await params.dataStore.insertMultipartUploadStatus({
        status: uploadStatus,
      });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Updates UploadStatus
   *
   * @private
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     file: DZFile;
   *     uploadStatus: MultipartFileUploadStatus;
   *     multipartData: MultipartUploadData;
   *   }} params
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  private static async updateUploadStatus(params: {
    dataStore: DataStore;
    file: DZFile;
    uploadStatus: MultipartFileUploadStatus;
    multipartData: MultipartUploadData;
  }): Promise<void> {
    try {
      // Update status by incrementing parts uploaded * bytes uploaded
      const updates: MultipartFileUploadStatusUpdates = {
        partsUploaded: params.uploadStatus.partsUploaded + 1,
        bytesUploaded:
          params.uploadStatus.bytesUploaded + +params.file.dzchunksize,
      };
      return await params.dataStore.updateMultipartUploadStatus({
        updates,
        id: params.uploadStatus._id,
        completedPart: params.multipartData.completedPart,
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
      LibraryInteractor.cleanObjectsFromLibraries(learningObjectIDs);
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
            object.metrics = await this.loadMetrics(object.id);
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
            object.metrics = await this.loadMetrics(object.id);
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
            object.metrics = await this.loadMetrics(object.id);
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
    name: string,
    author: string,
    collection: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
    currPage?: number,
    limit?: number,
    released?: boolean
  ): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      if (text) {
        const firstChar = text.charAt(0);
        const lastChar = text.charAt(text.length - 1);
        if (firstChar !== `"` && lastChar !== `"`) {
          text = this.removeStopwords(text);
        }
      }
      const response = await dataStore.searchObjects(
        name,
        author,
        collection,
        length,
        level,
        standardOutcomeIDs,
        text,
        accessUnpublished,
        orderBy,
        sortType,
        currPage,
        limit,
        released
      );

      response.objects = await Promise.all(
        response.objects.map(async object => {
          try {
            object.metrics = await this.loadMetrics(object.id);
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

  public static async fetchCollections(
    dataStore: DataStore,
    loadObjects?: boolean,
  ): Promise<any> {
    try {
      const collections = await dataStore.fetchCollections(loadObjects);
      return collections;
    } catch (e) {
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
  private static async loadMetrics(objectID: string): Promise<Metrics> {
    try {
      return LibraryInteractor.getMetrics(objectID);
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
      id: file.dzuuid,
      name: file.name,
      fileType: file.mimetype,
      extension: extension,
      fullPath: file.fullPath,
      packageable: this.isPackageable(file),
    };

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
