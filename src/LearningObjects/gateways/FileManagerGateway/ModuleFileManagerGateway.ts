import { FileManagerGateway } from '../../interfaces';
import { FileUpload } from '../../../shared/types';
import { FileManagerModule } from '../../../FileManager/FileManagerModule';
import { Requester } from '../../../FileMetadata/typings';
import { LearningObject } from '../../../shared/entity';

export class ModuleFileManagerGateway implements FileManagerGateway {
  /**
   * @inheritdoc
   *
   *
   * Proxies FileManagerModule's `uploadFile`
   *
   * @returns {Promise<void}
   * @memberof ModuleFileManagerGateway
   */
  uploadFile(params: {
    authorUsername: string;
    learningObjectCUID: string;
    version: number;
    file: FileUpload;
  }): Promise<void> {
    return FileManagerModule.uploadFile(params);
  }
  /**
   * @inheritdoc
   *
   *
   * Proxies FileManagerModule's `deleteFile`
   *
   * @returns {Promise<void}
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
   *
   * Proxies FileManagerModule's `deleteFolder`
   *
   * @returns {Promise<void}
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

  /**
   * @inheritdoc
   *
   * Proxies FileManagerModule's `deleteAllFiles`
   *
   * @returns {Promise<void>}
   * @memberof ModuleFileManagerGateway
   */
  deleteAllFiles(params: {
    requester: Requester;
    learningObject: LearningObject;
  }): Promise<void> {
    return FileManagerModule.deleteAllFiles(params);
  }
}
