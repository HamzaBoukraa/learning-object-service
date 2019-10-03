import { Readable } from 'stream';
import { FileUpload } from '../typings';

export abstract class FileManager {
  /**
   * Uploads a single file to a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectVersion [The version of the Learning Object]
   * @param {FileUpload} file [Object containing file data and the path the file should be uploaded to]
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract upload(params: {
    authorUsername: string;
    learningObjectCUID: string;
    learningObjectVersion: number;
    file: FileUpload;
  }): Promise<void>;

  /**
   * Deletes a single file from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectVersion [The version of the Learning Object]
   * @param {string} path [The path of the file to delete]
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract delete(params: {
    authorUsername: string;
    learningObjectCUID: string;
    learningObjectVersion: number;
    path: string;
  }): Promise<void>;

  /**
   * Deletes all files within a given folder from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectVersion [The version of the Learning Object]
   * @param {string} path [The path of the folder to delete]
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract deleteFolder(params: {
    authorUsername: string;
    learningObjectCUID: string;
    learningObjectVersion: number;
    path: string;
  }): Promise<void>;

  /**
   * Returns a readable stream of a user's Learning Object's file given a file path
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectVersion [The version of the Learning Object]
   * @param {string} path [The path of the file to get stream for]
   * @returns {Promise<Readabale>}
   * @memberof FileManager
   */
  abstract streamFile(params: {
    authorUsername: string;
    learningObjectCUID: string;
    learningObjectVersion: number;
    path: string;
  }): Promise<Readable>;

  /**
   * Copies a given Directory to a new location
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} currentlearningObjectVersion [The version of the Learning Object]
   * @param {string} newlearningObjectVersion [The new version of the Learning Object]
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract copyDirectory(params: {
    authorUsername: string;
    learningObjectCUID: string;
    currentLearningObjectVersion: number;
    newLearningObjectVersion: number;
  }): Promise<void>;

  /**
   * Determines if the requester is authorized
   * to manipulate the user's Learning Object's file at the given path
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectVersion [The version of the Learning Object]
   * @param {string} path [The path of the file]
   * @returns {Promise<boolean>}
   * @memberof FileManager
   */
  abstract hasAccess(params: {
    authorUsername: string;
    learningObjectCUID: string;
    learningObjectVersion: number;
    path: string;
  }): Promise<boolean>;
}
