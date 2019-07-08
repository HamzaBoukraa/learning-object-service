import { Readable } from 'stream';
import {
  FileUpload,
  CompletedPart,
  CompletedPartList,
} from '../typings';

export abstract class FileManager {

  /**
   * Uploads a single file
   *
   * @abstract
   * @param {{ file: FileUpload }} params
   * @returns {Promise<string>}
   * @memberof FileManager
   */
  abstract upload(params: {
    file: FileUpload;
  }): Promise<string>;

  /**
   * Deletes a single file
   *
   * @abstract
   * @param {{ path: string }} params
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract delete(params: {
    path: string;
  }): Promise<void>;

  /**
   * Deletes all files within a given folder
   *
   * @abstract
   * @param {{ path: string }} params
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract deleteFolder(params: {
    path: string;
  }): Promise<void>;

  /**
   * Deletes all files in storage
   *
   * @abstract
   * @param {{ path: string}} params
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract deleteAll(params: {
    path: string;
  }): Promise<void>;

  /**
   * Returns a readable stream given a file path
   *
   * @abstract
   * @param {path string} params
   * @returns {Readabale}
   * @memberof FileManager
   */
  abstract streamFile(params: {
    path: string;
  }): Readable;

  /**
   * Returns a readable stream for a file of
   * a working copy Learning Object
   *
   * @abstract
   * @param {path string} params
   * @returns {Readabale}
   * @memberof FileManager
   */
  abstract streamWorkingCopyFile(params: {
    path: string;
  }): Readable;

  /**
   * Determines if the requester is authorized
   * to manipulate the file at the given path
   *
   * @abstract
   * @param {path string} params
   * @returns {Promise<boolean>}
   * @memberof FileManager
   */
  abstract hasAccess(path: string): Promise<boolean>;
}
