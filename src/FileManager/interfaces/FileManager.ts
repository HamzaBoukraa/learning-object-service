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

  abstract initMultipartUpload(params: {
    path: string;
  }): Promise<string>;

  abstract uploadPart(params: {
    path: string;
    data: any;
    partNumber: number;
    uploadId: string;
  }): Promise<CompletedPart>;

  abstract completeMultipartUpload(params: {
    path: string;
    uploadId: string;
    completedPartList: CompletedPartList;
  }): Promise<string>;

  /**
   * Cancels chunk upload
   *
   * @abstract
   * @param {{
   *     path: string;
   *     uploadId: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof FileManager
   */
  abstract abortMultipartUpload(params: {
    path: string;
    uploadId: string;
  }): Promise<void>;

 /**
  * Copies all objects in source folder from working files bucket 
  * to destination folder in released files bucket
  *
  * @param {{
  *     srcFolder: string;
  *     destFolder: string;
  *   }} params
  * @returns {Promise<void>}
  * @memberof FileManager
  */
  abstract copyToReleased(params: {
    srcFolder: string;
    destFolder: string;
  }): Promise<void>;
}

