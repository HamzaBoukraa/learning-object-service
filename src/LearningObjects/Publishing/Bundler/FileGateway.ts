import { Readable } from 'stream';

export abstract class FileGateway {
  /**
   * Retrieves a Readable stream if a user's Learning Object's file
   *
   * @abstract
   * @param {string} authorUsername [The username of the Learning Object's author]
   * @param {string} learningObjectId [The id of the Learning Object]
   * @param {string} path [The path of the file including name and extension]
   * @returns {Promise<Readable>}
   * @memberof FileGateway
   */
  abstract getFileStream(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<Readable>;
}
