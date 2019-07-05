import { Readable } from 'stream';
import {
  FileUpload,
  CompletedPart,
  CompletedPartList,
} from '../typings/file-manager';

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

  abstract streamFile(params: {
    path: string;
  }): Readable;

  abstract streamWorkingCopyFile(params: {
    path: string;
  }): Readable;

  abstract hasAccess(path: string): Promise<boolean>;
}
