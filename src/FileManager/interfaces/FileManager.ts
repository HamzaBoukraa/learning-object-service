import { Readable } from 'stream';
import { FileUpload } from '../typings';

export abstract class FileManager {
  /**
   * Uploads a single file to a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {FileUpload} file [Object containing file data and the path the file should be uploaded to]
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract upload(params: {
    authorUsername: string;
    learningObjectId: string;
    file: FileUpload;
  }): Promise<void>;

  /**
   * Deletes a single file from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the file to delete]
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract delete(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void>;

  /**
   * Deletes all files within a given folder from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the folder to delete]
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract deleteFolder(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void>;

  /**
   * Returns a readable stream of a user's Learning Object's file given a file path
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the file to get stream for]
   * @returns {Readabale}
   * @memberof FileManager
   */
  abstract streamFile(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Readable;

  /**
   * Determines if the requester is authorized
   * to manipulate the user's Learning Object's file at the given path
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the file]
   * @returns {Promise<boolean>}
   * @memberof FileManager
   */
  abstract hasAccess(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<boolean>;
}