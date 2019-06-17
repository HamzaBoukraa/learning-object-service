import {
  FileMetadataInsert,
  FileMetadataUpdate,
  FileMetadataDocument,
} from '../typings';

export abstract class FileMetaDatastore {
  /**
   * Checks if FileMetadataDocument exists by the file's `fullPath` for a given Learning Object revision
   *
   * *** NOTE ***
   * The FileMetadataDocument is found using `fullPath` because this represents the location the file was uploaded to within the Learning Object’s file system hierarchy
   * which is unique as no two files can have the same path within the file system hierarchy
   *
   * @abstract
   * @param {{
   *     learningObjectId: string;
   *     learningObjectRevision: string;
   *     fullPath: string;
   *   }} params
   * @returns {Promise<boolean>}
   * @memberof FileMetaDatastore
   */
  abstract fileMetaExists(params: {
    learningObjectId: string;
    learningObjectRevision: string;
    fullPath: string;
  }): Promise<boolean>;

  /**
   * Fetches FileMetadataDocument by id
   *
   * @abstract
   * @param {string} id [Id of the FileMetadataDocument]
   * @returns {Promise<FileMetadataDocument>}
   */
  abstract fetchFileMeta(id: string): Promise<FileMetadataDocument>;

  /**
   * Fetches all FileMetadataDocuments that match the specified `learningObjectId` and `learningObjectRevision`
   *
   * @abstract
   * @param {string} learningObjectId [Id of the Learning Object]
   * @param {number} learningObjectRevision [Revision number of the Learning Object]
   * @returns {Promise<FileMetadataDocument[]>}
   */
  abstract fetchAllFileMeta(params: {
    learningObjectId: string;
    learningObjectRevision: number;
  }): Promise<FileMetadataDocument[]>;

  /**
   * Inserts new FileMetadataDocument
   *
   * @abstract
   * @param {FileMetadataInsert} fileMeta [FileMetadataDocument to insert]
   * @returns {Promise<string>}
   */
  abstract insertFileMeta(fileMeta: FileMetadataInsert): Promise<string>;

  /**
   * Updates FileMetadataDocument
   *
   * @abstract
   * @param {string} id [Id of the FileMetadataDocument]
   * @param {FileMetadataUpdate} updates [Updates to apply to FileMetadataDocument]
   * @returns {Promise<void>}
   */
  abstract updateFileMeta(params: {
    id: string;
    updates: FileMetadataUpdate;
  }): Promise<void>;

  /**
   * Deletes FileMetadataDocument by id
   *
   * @abstract
   * @param {string} id [Id of the FileMetadataDocument]
   * @returns {Promise<void>}
   */
  abstract deleteFileMeta(id: string): Promise<void>;

  /**
   * Deletes all FileMetadataDocuments that match the specified `learningObjectId` and `learningObjectRevision`
   *
   * @abstract
   * @param {string} learningObjectId [Id of the Learning Object]
   * @param {number} learningObjectRevision [Revision number of the Learning Object]
   * @returns {Promise<void>}
   */
  abstract deleteAllFileMeta(params: {
    learningObjectId: string;
    learningObjectRevision: number;
  }): Promise<void>;
}
