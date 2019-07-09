import { FileGateway } from './FileGateway';
import { Readable } from 'stream';

export class ModuleFileGateway implements FileGateway {
  /**
   * @inheritdoc
   *
   * Proxies FileManagerModule's `streamFile`
   *
   * @returns {Promise<Readable>}
   * @memberof ModuleFileGateway
   */
  getFileStream(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<Readable> {
    //   TODO: Swap out with call to FileManagerModule's `streamFile`
    return Promise.resolve(null);
  }
}
