import { DataStore, FileManager, Responder } from '../interfaces/interfaces';
import { LearningObject, LearningOutcome } from '@cyber4all/clark-entity';
import * as PDFKit from 'pdfkit';
import * as stopword from 'stopword';
import * as striptags from 'striptags';
import * as https from 'https';
import { LearningObjectQuery } from '../interfaces/DataStore';
import { Metrics } from '@cyber4all/clark-entity/dist/learning-object';
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
import { LEARNING_OBJECT_ROUTES } from '../routes';
// TODO: Update File in clark-entity
export interface LearningObjectFile extends File {
  packageable: boolean;
}
type GradientVector = [number, number, number, number];
type PDFHeaderAlignment = 'left' | 'right' | 'center' | 'justify';
enum PDFFonts {
  REGULAR = 'Helvetica',
  BOLD = 'Helvetica-Bold',
}
enum PDFFontSizes {
  JUMBO = 25,
  LARGE = 20,
  MEDIUM = 18,
  REGULAR = 14.5,
}
enum PDFColors {
  TEXT = '#333',
  DARK_TEXT = '#3b3c3e',
  LINK = '#1B9CFC',
  BANNER = '#3b608b',
  WHITE = '#FFF',
  DARK_BLUE = '#2b4066',
  LIGHT_BLUE = '#3b608b',
}
enum PDFText {
  CREATOR = 'C.L.A.R.K. | Cybersecurity Labs and Resource Knowledge-base',
  COVER_PAGE_TITLE = 'CLARK | Cybersecurity Labs and Resource Knowledge-base',
  OUTCOMES_TITLE = 'Outcomes',
  DESCRIPTION_TITLE = 'Description',
  MATERIALS_TITLE = 'Content',
  UNPACKED_FILES_TITLE = 'Resources',
  UNPACKED_FILES_DESCRIPTION = 'These materials on CLARK are required to use this learning object.',
  ASSESSMENTS_TITLE = 'Assessments',
  INSTRUCTIONAL_STRATEGIES_TITLE = 'Instructional Strategies',
  URLS_TITLE = 'Links',
  NOTES_TITLE = 'Notes',
}

export type LearningObjectPDF = {
  name: string;
  url: string;
};

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

  /**
   * Add a new learning object to the database.
   * NOTE: this function only adds basic fields;
   *       the user.outcomes field is ignored
   * NOTE: promise rejected if another learning object
   *       tied to the same author and with the same 'name' field
   *       already exists
   *
   * @async
   *
   * @param {UserID} author - database id of the parent
   * @param {LearningObject} object - entity to add
   *
   * @returns {LearningObjectID} the database id of the new record
   */
  public static async addLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    object: LearningObject,
  ): Promise<LearningObject> {
    try {
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      } else {
        const learningObjectID = await dataStore.insertLearningObject(object);
        object.id = learningObjectID;

        // Generate PDF and update Learning Object with PDF meta.
        object = await this.updateReadme({
          fileManager,
          object,
          dataStore,
        });
        this.updateLearningObject(dataStore, fileManager, object.id, object);

        return object;
      }
    } catch (e) {
      // The duplicate key error is produced by Mongo, via a constraint on the authorID/name compound index
      // FIXME: This should be an error that is encapsulated within the MongoDriver, since it is specific to Mongo's indexing functionality
      if (/duplicate key error/gi.test(e)) {
        return Promise.reject(
          `Could not save Learning Object. Learning Object with name: ${
            object.name
          } already exists.`,
        );
      }
      return Promise.reject(`Problem creating Learning Object. Error${e}`);
    }
  }

  private static validateLearningObject(object: LearningObject): string {
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
    fileName: string;
    dataStore: DataStore;
    fileManager: FileManager;
    responder: Responder;
  }): Promise<any> {
    try {
      // Collect requested file metadata from datastore
      const fileMetaData = await params.dataStore.findSingleFile({
        learningObjectId: params.learningObjectId,
        fileName: params.fileName,
      });

      const url = fileMetaData['materials'].files[0].url;

      // Make http request using attached url in file metadata, pipe response
      // tslint:disable-next-line:max-line-length
      https.get(url, res => {
        res.pipe(params.responder.writeStream(params.fileName));
      });
    } catch (e) {
      Promise.reject(e);
    }
  }

  /**
   * Updates or inserts metadata for file as LearningObjectFile
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
      const learningObject = await params.dataStore.fetchLearningObject(
        params.id,
        true,
        true,
      );
      let found = false;
      for (let i = 0; i < learningObject.materials.files.length; i++) {
        const oldFile = learningObject.materials.files[i];
        if (params.loFile.url === oldFile.url) {
          found = true;
          params.loFile.description = oldFile.description;
          learningObject.materials.files[i] = params.loFile;
          break;
        }
      }
      if (!found) {
        learningObject.materials.files.push(params.loFile);
      }
      return await params.dataStore.editLearningObject(
        params.id,
        learningObject,
      );
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
   * Deletes specified file
   *
   * @static
   * @param {FileManager} fileManager
   * @param {Responder} responder
   * @param {string} id
   * @param {string} username
   * @param {string} filename
   * @returns {Promise<void>}
   * @memberof LearningObjectInteractor
   */
  public static async deleteFile(
    fileManager: FileManager,
    id: string,
    username: string,
    filename: string,
  ): Promise<void> {
    try {
      const path = `${username}/${id}/${filename}`;
      return fileManager.delete({ path });
    } catch (e) {
      return Promise.reject(`Problem deleting file. Error: ${e}`);
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

  /**
   * Update an existing learning object record.
   * NOTE: promise rejected if another learning object
   *       tied to the same author and with the same 'name' field
   *       already exists
   *
   * @async
   *
   * @param {LearningObjectID} id - database id of the record to change
   * @param {LearningObject} object - entity with values to update to
   */
  public static async updateLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    id: string,
    object: LearningObject,
  ): Promise<void> {
    try {
      const err = this.validateLearningObject(object);
      if (!err) {
        object = await this.updateReadme({
          dataStore,
          fileManager,
          object,
        });
        return await dataStore.editLearningObject(id, object);
      } else {
        throw new Error(err);
      }
    } catch (e) {
      return Promise.reject(`Problem updating Learning Object. Error: ${e}`);
    }
  }

  /**
   * Updates Readme PDF for Learning Object
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     fileManager: FileManager;
   *     object?: LearningObject;
   *     id?: string;
   *   }} params
   * @returns {Promise<LearningObject>}
   * @memberof LearningObjectInteractor
   */
  public static async updateReadme(params: {
    dataStore: DataStore;
    fileManager: FileManager;
    object?: LearningObject;
    id?: string;
  }): Promise<LearningObject> {
    try {
      let object = params.object;
      const id = params.id;
      if (!object && id) {
        object = await params.dataStore.fetchLearningObject(id, true, true);
      } else if (!object && !id) {
        throw new Error(`No learning object or id provided.`);
      }
      const oldPDF: LearningObjectPDF = object.materials['pdf'];
      const pdf = await this.generatePDF(params.fileManager, object);

      if (oldPDF && oldPDF.name !== pdf.name) {
        this.deleteFile(
          params.fileManager,
          object.id,
          object.author.username,
          oldPDF.name,
        );
      }

      object.materials['pdf'] = {
        name: pdf.name,
        url: pdf.url,
      };
      return object;
    } catch (e) {
      return Promise.reject(
        `Problem updating Readme for learning object. Error: ${e}`,
      );
    }
  }

  public static async togglePublished(
    dataStore: DataStore,
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    try {
      const object = await dataStore.fetchLearningObject(id, true, true);
      published ? object.publish() : object.unpublish();
      const err = this.validateLearningObject(object);
      if (err) {
        return Promise.reject(err);
      }
      return dataStore.togglePublished(username, id, published);
    } catch (e) {
      return Promise.reject(`Problem toggling publish status. Error:  ${e}`);
    }
  }

  public static async deleteLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    username: string,
    learningObjectName: string,
  ): Promise<void> {
    try {
      const learningObjectID = await dataStore.findLearningObject(
        username,
        learningObjectName,
      );
      const learningObject = await dataStore.fetchLearningObject(
        learningObjectID,
        false,
        true,
      );
      await dataStore.deleteLearningObject(learningObjectID);
      if (learningObject.materials.files.length) {
        const path = `${username}/${learningObjectID}/`;
        await fileManager.deleteAll({ path });
      }
      LibraryInteractor.cleanObjectsFromLibraries([learningObjectID]);
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Object. Error: ${error}`,
      );
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
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
    currPage?: number,
    limit?: number,
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
        length,
        level,
        standardOutcomeIDs,
        text,
        accessUnpublished,
        orderBy,
        sortType,
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

  /**
   * Generates PDF for Learning Object
   *
   * @private
   * @static
   * @param {FileManager} fileManager
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static generatePDF(
    fileManager: FileManager,
    learningObject: LearningObject,
  ) {
    // Create new Doc and Track Stream
    const doc = new PDFKit();
    // Create array to catch Buffers
    const buffers: Buffer[] = [];
    // Add Event Handlers
    const pdf = this.addEventListeners(
      fileManager,
      doc,
      buffers,
      learningObject,
    );
    const gradientRGB: GradientVector = [0, 0, 650, 0];
    // MetaData
    this.appendMetaData(doc, learningObject);
    // Cover Page
    this.appendGradientHeader({
      gradientRGB,
      doc,
      title: PDFText.COVER_PAGE_TITLE,
      headerYStart: 0,
      textXStart: 100,
      textYStart: 22,
    });
    this.appendCoverPage(doc, learningObject);
    doc.addPage();
    // Goals
    if (learningObject.goals.length) {
      this.appendGradientHeader({
        gradientRGB,
        doc,
        title: PDFText.DESCRIPTION_TITLE,
        headerYStart: doc.y - 75,
        textYStart: doc.y - 70 + 20,
      });
      this.appendLearningGoals(doc, learningObject);
    }
    // Outcomes
    if (learningObject.outcomes.length) {
      this.appendGradientHeader({
        gradientRGB,
        doc,
        title: PDFText.OUTCOMES_TITLE,
      });
      this.appendOutcomes(doc, learningObject);
    }
    // Content (Urls)
    if (
      learningObject.materials.urls.length ||
      learningObject.materials.notes
    ) {
      this.appendGradientHeader({
        gradientRGB,
        doc,
        title: PDFText.MATERIALS_TITLE,
      });
      this.appendTextMaterials(doc, learningObject);
    }
    // Unpacked Files
    const unpackedFiles = learningObject.materials.files.filter(
      f => !f['packageable'],
    );
    if (unpackedFiles.length) {
      this.appendGradientHeader({
        gradientRGB,
        doc,
        title: PDFText.UNPACKED_FILES_TITLE,
      });
      this.appendUnpackedFileURLs({
        doc,
        files: <LearningObjectFile[]>unpackedFiles,
        id: learningObject.id,
      });
    }
    doc.end();
    return pdf;
  }

  /**
   * Adds event listeners to PDF write process
   *
   * @private
   * @static
   * @param {FileManager} fileManager
   * @param {PDFKit.PDFDocument} doc
   * @param {Buffer[]} buffers
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static addEventListeners(
    fileManager: FileManager,
    doc: PDFKit.PDFDocument,
    buffers: Buffer[],
    learningObject: LearningObject,
  ): Promise<LearningObjectPDF> {
    doc.on('data', (data: Buffer) => {
      buffers.push(data);
    });
    doc.on('error', e => {
      console.log(e);
    });

    return new Promise<LearningObjectPDF>(resolve => {
      doc.on('end', async () => {
        const buffer: Buffer = Buffer.concat(buffers);
        const fileName = `0ReadMeFirst - ${learningObject.name}.pdf`;
        const path = `${learningObject.author.username}/${
          learningObject.id
        }/${fileName}`;
        const fileUpload: FileUpload = {
          path,
          data: buffer,
        };
        const url = await fileManager.upload({ file: fileUpload });
        resolve({
          url,
          name: fileName,
        });
      });
    });
  }

  /**
   * Adds MetaData to PDF Document
   *
   * @private
   * @static
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendMetaData(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc.info.Title = learningObject.name;
    doc.info.Author = learningObject.author.name;
    doc.info.Creator = PDFText.CREATOR;
    doc.info.CreationDate = new Date(+learningObject.date);
    doc.info.ModDate = new Date();
  }

  /**
   * Adds Cover Page to PDF Document
   *
   * @private
   * @static
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendCoverPage(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc.moveDown(8);
    doc
      .fontSize(PDFFontSizes.JUMBO)
      .fillColor(PDFColors.TEXT)
      .text(learningObject.name, { align: 'center' });
    doc.moveDown(2);
    doc.font(PDFFonts.REGULAR);
    doc.fontSize(PDFFontSizes.LARGE).text(learningObject.length.toUpperCase(), {
      align: 'center',
    });
    doc.moveDown(2);
    const authorName = titleCase(learningObject.author.name);
    doc.fontSize(PDFFontSizes.MEDIUM).text(
      `${authorName} - ${new Date(+learningObject.date).toLocaleDateString(
        'en-US',
        {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      { align: 'center' },
    );
  }

  /**
   * Adds Learning Goals to PDF Document
   *
   * @private
   * @static
   * @param {number[]} gradientRGB
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendLearningGoals(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc
      .fillColor(PDFColors.TEXT)
      .fontSize(PDFFontSizes.REGULAR)
      .font(PDFFonts.REGULAR);
    // Only get first goal for 'description'
    const goal = learningObject.goals[0];
    // Strip html tags from rich text
    const text = striptags(goal.text);
    doc.text(text);
    doc.moveDown(0.5);
    doc.moveDown(2);
  }

  /**
   * Appends Outcomes to PDF Document
   *
   * @private
   * @static
   * @param {number[]} gradientRGB
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendOutcomes(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    learningObject.outcomes.forEach(outcome => {
      this.appendOutcomeHeader(doc, outcome);
      // Assessments
      if (outcome.assessments.length) {
        this.appendOutcomeAssessments(doc, outcome);
      }
      // Instructional Strategies
      if (outcome.strategies.length) {
        this.appendOutcomeStrategies(doc, outcome);
      }
      doc.moveDown(2);
    });
  }

  /**
   * Appends Header for Outcome Section
   *
   * @private
   * @static
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningOutcome} outcome
   * @memberof LearningObjectInteractor
   */
  private static appendOutcomeHeader(
    doc: PDFKit.PDFDocument,
    outcome: LearningOutcome,
  ) {
    doc
      .fillColor(PDFColors.BANNER)
      .fontSize(PDFFontSizes.REGULAR)
      .font(PDFFonts.BOLD);
    doc.text(outcome.bloom);
    doc.moveDown(0.5);
    doc
      .fontSize(PDFFontSizes.REGULAR)
      .font(PDFFonts.REGULAR)
      .fillColor(PDFColors.TEXT);
    doc.text(
      `Students will be able to ${outcome.verb.toLowerCase()} ${outcome.text}`,
    );
  }

  /**
   * Appends Outcome Assessments to PDF Document
   *
   * @private
   * @static
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningOutcome} outcome
   * @memberof LearningObjectInteractor
   */
  private static appendOutcomeAssessments(
    doc: PDFKit.PDFDocument,
    outcome: LearningOutcome,
  ) {
    doc
      .fillColor(PDFColors.BANNER)
      .fontSize(PDFFontSizes.REGULAR)
      .font(PDFFonts.BOLD);
    doc.text(PDFText.ASSESSMENTS_TITLE);
    doc.moveDown(0.5);
    outcome.assessments.forEach(assessment => {
      doc.fillColor(PDFColors.TEXT);
      doc.text(assessment.plan);
      doc.moveDown(0.5);
      doc.font(PDFFonts.REGULAR);
      doc.text(assessment.text);
      doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  /**
   * Appends Outcome Strategies to PDF Document
   *
   * @private
   * @static
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningOutcome} outcome
   * @memberof LearningObjectInteractor
   */
  private static appendOutcomeStrategies(
    doc: PDFKit.PDFDocument,
    outcome: LearningOutcome,
  ) {
    doc
      .fillColor(PDFColors.BANNER)
      .fontSize(PDFFontSizes.REGULAR)
      .font(PDFFonts.BOLD);
    doc.text(PDFText.INSTRUCTIONAL_STRATEGIES_TITLE);
    doc.moveDown(0.5);
    outcome.strategies.forEach(strategy => {
      doc.fillColor(PDFColors.TEXT);
      doc.text(strategy.plan);
      doc.moveDown(0.5);
      doc.font(PDFFonts.REGULAR);
      doc.text(strategy.text);
      doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  /**
   * Appends Text Based Materials to PDF Document
   *
   * @private
   * @static
   * @param {number[]} gradientRGB
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendTextMaterials(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    // Content (URLs)
    if (learningObject.materials.urls.length) {
      this.appendMaterialURLs(doc, learningObject);
    }
    // Content (Notes)
    if (learningObject.materials.notes) {
      this.appendMaterialNotes(doc, learningObject);
    }
    doc.moveDown(2);
  }

  /**
   * Appends Material URLs to PDF Document
   *
   * @private
   * @static
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendMaterialURLs(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc
      .fillColor(PDFColors.BANNER)
      .fontSize(PDFFontSizes.REGULAR)
      .font(PDFFonts.BOLD);
    doc.text(PDFText.URLS_TITLE);
    doc.moveDown(0.5);
    learningObject.materials.urls.forEach(url => {
      doc.fillColor(PDFColors.DARK_TEXT);
      doc.text(url.title);
      doc.moveDown(0.25);
      doc.font(PDFFonts.REGULAR).fillColor(PDFColors.LINK);
      doc.text(`${url.url}`, doc.x, doc.y, {
        link: url.url,
        underline: true,
      });
      doc.moveDown(0.5);
    });
    doc.moveDown(1);
  }

  /**
   * Appends Material Notes to PDF Document
   *
   * @private
   * @static
   * @param {PDFKit.PDFDocument} doc
   * @param {LearningObject} learningObject
   * @memberof LearningObjectInteractor
   */
  private static appendMaterialNotes(
    doc: PDFKit.PDFDocument,
    learningObject: LearningObject,
  ) {
    doc
      .fillColor(PDFColors.BANNER)
      .fontSize(PDFFontSizes.REGULAR)
      .font(PDFFonts.BOLD);
    doc.text(PDFText.NOTES_TITLE);
    doc.moveDown(0.5);
    doc.fillColor(PDFColors.TEXT).font(PDFFonts.REGULAR);
    doc.text(learningObject.materials.notes);
  }

  /**
   * Appends Unpacked file URLs to PDF Document
   *
   * @private
   * @static
   * @param {GradientVector} gradientRGB
   * @param {PDFKit.PDFDocument} doc
   * @param {files} LearningObjectFile[]
   * @memberof LearningObjectInteractor
   */
  private static appendUnpackedFileURLs(params: {
    doc: PDFKit.PDFDocument;
    files: LearningObjectFile[];
    id: string;
  }) {
    params.doc.fillColor(PDFColors.TEXT).font(PDFFonts.REGULAR);
    params.doc.text(PDFText.UNPACKED_FILES_DESCRIPTION, { align: 'center' });
    params.doc.moveDown(2);
    params.files.forEach(file => {
      params.doc.fillColor(PDFColors.DARK_TEXT);
      params.doc.text(file.name);
      params.doc.moveDown(0.25);

      if (file.description) {
        params.doc.font(PDFFonts.REGULAR).fillColor(PDFColors.TEXT);
        params.doc.text(file.description);
        params.doc.moveDown(0.25);
      }

      params.doc.font(PDFFonts.REGULAR).fillColor(PDFColors.LINK);
      const url = LEARNING_OBJECT_ROUTES.GET_FILE(params.id, file.name);
      params.doc.text(`${url}`, params.doc.x, params.doc.y, {
        link: url,
        underline: true,
      });
      params.doc.moveDown(0.5);
    });
    params.doc.moveDown(1);
  }

  /**
   * Appends header with gradient background to PDF
   *
   * @private
   * @static
   * @param {{
   *     gradientRGB: GradientVector;
   *     doc: PDFKit.PDFDocument;
   *     title: string;
   *   }} params
   * @memberof LearningObjectInteractor
   */
  private static appendGradientHeader(params: {
    gradientRGB: GradientVector;
    doc: PDFKit.PDFDocument;
    title: string;
    align?: PDFHeaderAlignment;
    fontSize?: number;
    height?: number;
    headerYStart?: number;
    textYStart?: number;
    textXStart?: number;
  }) {
    const grad = params.doc.linearGradient(...params.gradientRGB);
    grad.stop(0, PDFColors.DARK_BLUE).stop(1, PDFColors.LIGHT_BLUE);
    params.doc
      .rect(
        0,
        params.headerYStart !== undefined ? params.headerYStart : params.doc.y,
        650,
        params.height ? params.height : 50,
      )
      .fill(grad);
    params.doc.stroke();
    params.doc
      .fontSize(params.fontSize ? params.fontSize : PDFFontSizes.REGULAR)
      .font(PDFFonts.BOLD)
      .fillColor(PDFColors.WHITE)
      .text(
        params.title,
        params.textXStart !== undefined ? params.textXStart : params.doc.x,
        params.textYStart !== undefined ? params.textYStart : params.doc.y + 20,
        {
          align: params.align ? params.align : 'center',
        },
      );
    params.doc.moveDown(2);
  }
}

export function titleCase(text: string): string {
  const textArr = text.split(' ');
  for (let i = 0; i < textArr.length; i++) {
    let word = textArr[i];
    word = word.charAt(0).toUpperCase() + word.slice(1, word.length + 1);
    textArr[i] = word;
  }
  return textArr.join(' ');
}
const MAX_CHAR = 250;
export function sanitizeFileName(name: string): string {
  let clean = name.replace(/[\\/:"*?<>|]/gi, '_');
  if (clean.length > MAX_CHAR) {
    clean = clean.slice(0, MAX_CHAR);
  }
  return clean;
}
