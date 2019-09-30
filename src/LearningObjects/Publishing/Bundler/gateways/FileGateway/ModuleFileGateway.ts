import { FileGateway } from '../../interfaces';
import { Readable } from 'stream';
import { FileManagerModule } from '../../../../../FileManager/FileManagerModule';

export class ModuleFileGateway implements FileGateway {
  /**
   * @inheritdoc
   *
   * Proxies FileManagerModule's `getFileStream`
   *
   * @returns {Promise<Readable>}
   * @memberof ModuleFileGateway
   */
  getFileStream(params: {
    authorUsername: string;
    learningObjectCUID: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<Readable> {
    return FileManagerModule.getFileStream(params);
  }
}
