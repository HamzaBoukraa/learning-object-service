import { FileManagerOperations } from '../../FileManager/FileManagerModule';

export abstract class FileManagerGateway
  implements Partial<FileManagerOperations> {
  /**
   * Deletes the file at the specified path from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the file to delete]
   * @returns {Promise<void>}
   */
  abstract deleteFile(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void>;

  /**
   * Deletes the folder at the specified path from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the folder to delete]
   * @returns {Promise<void>}
   */
  abstract deleteFolder(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void>;
}
