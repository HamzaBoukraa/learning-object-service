import { Readable } from 'stream';
import { FileManagerModule } from '../../../../FileManager/FileManagerModule';

export abstract class FileGateway implements Partial<FileManagerModule> {
  /**
   * Retrieves a Readable stream of a user's Learning Object's file
   *
   * @abstract
   * @param {string} authorUsername [The username of the Learning Object's author]
   * @param {string} learningObjectId [The id of the Learning Object]
   * @param {number} version [The version of the Learning Object]
   * @param {string} path [The path of the file including name and extension]
   * @returns {Promise<Readable>}
   * @memberof FileGateway
   */
  abstract getFileStream(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    path: string;
  }): Promise<Readable>;
}
