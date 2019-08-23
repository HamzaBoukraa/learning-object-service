export abstract class FileManagerGateway {
  /**
   * Deletes the file at the specified path from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
   * @param {string} path [The path of the file to delete]
   * @returns {Promise<void>}
   */
  abstract deleteFile(params: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<void>;

  /**
   * Deletes the folder at the specified path from a user's Learning Object
   *
   * @abstract
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
   * @param {string} path [The path of the folder to delete]
   * @returns {Promise<void>}
   */
  abstract deleteFolder(params: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<void>;
}
