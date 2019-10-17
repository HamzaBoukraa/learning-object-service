import { FileUpload } from '../../shared/types';

export abstract class FileManagerGateway {
  /**
   * Uploads a file to a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} version [The version of the Learning Object]
   * @param {FileUpload} file [Data specifying what to upload and the path the data should exist at]
   * @returns {Promise<void>}
   */
  abstract uploadFile(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    file: FileUpload;
  }): Promise<void>;

  /**
   * Deletes the file at the specified path from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} version [The version of the Learning Object]
   * @param {string} path [The path of the file to delete]
   * @returns {Promise<void>}
   */
  abstract deleteFile(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    path: string;
  }): Promise<void>;

  /**
   * Deletes the folder at the specified path from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} version [The version of the Learning Object]
   * @param {string} path [The path of the folder to delete]
   * @returns {Promise<void>}
   */
  abstract deleteFolder(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    path: string;
  }): Promise<void>;
}
