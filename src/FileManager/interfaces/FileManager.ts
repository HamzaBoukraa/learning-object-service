import { Readable } from 'stream';
import {
  FileUpload,
  CompletedPart,
  CompletedPartList,
} from '../typings/file-manager';

export abstract class FileManager {


  /**
   * Uploads single file
   *
   * @param {{ file: FileUpload }} params
   * @returns {Promise<string>}
   * @memberof S3Driver
   */
  abstract upload(params: {
    file: FileUpload;
  }): Promise<string>;

  abstract delete(params: {
    path: string;
  }): Promise<void>;

  abstract deleteFolder(params: {
    path: string;
  }): Promise<void>;

    /**
   * Deletes all files in storage
   *
   * @param {string} path
   * @returns {Promise<void>}
   * @memberof S3Driver
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
   * @param {{
    *     path: string;
    *     uploadId: string;
    *   }} params
    * @returns {Promise<void>}
    * @memberof S3Driver
    */
  abstract abortMultipartUpload(params: {
    path: string;
    uploadId: string;
  }): Promise<void>;

/**
  * Copies all objects in source folder from working files bucket to destination folder in released files bucket
  *
  * @param {{
  *     srcFolder: string;
  *     destFolder: string;
  *   }} params
  * @returns {Promise<void>}
  * @memberof S3Driver
  */
  abstract copyToReleased(params: {
    srcFolder: string;
    destFolder: string;
  }): Promise<void>;
}

