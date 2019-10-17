import { FileManagerGateway } from '../../interfaces';
import { FileManagerModule } from '../../../FileManager/FileManagerModule';

export class ModuleFileManagerGateway implements FileManagerGateway {
  /**
   * @inheritdoc
   *
   * Proxies FileManagerModule's `deleteFile` method
   *
   * @returns {Promise<void>}
   * @memberof ModuleFileManagerGateway
   */
  deleteFile(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    path: string;
  }): Promise<void> {
    return FileManagerModule.deleteFile(params);
  }

  /**
   * @inheritdoc
   *
   * Proxies FileManagerModule's `deleteFolder` method
   *
   * @returns {Promise<void>}
   * @memberof ModuleFileManagerGateway
   */
  deleteFolder(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    path: string;
  }): Promise<void> {
    return FileManagerModule.deleteFolder(params);
  }
}
