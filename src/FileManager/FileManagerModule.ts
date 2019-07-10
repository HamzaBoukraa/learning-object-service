import {
  expressServiceModule,
  ExpressServiceModule,
} from 'node-service-module';
import { ExpressHttpAdapter } from './adapters';
import { uploadFile, deleteFile, deleteFolder } from './Interactor';
import {
  FileManager,
  LearningObjectGateway,
  FileMetadataGateway,
} from './interfaces';
import { S3FileManager, ModuleLearningObjectGateway } from './drivers';
import { FileUpload } from './typings';
import { FileMetadataModule } from '../FileMetadata/FileMetadataModule';

export interface FileManagerOperations {
  /**
   * Uploads a single file to a user's Learning Object
   *
   * @export
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {FileUpload} file [Object containing file data and the path the file should be uploaded to]
   *
   * @returns {Promise<void>}
   */
  uploadFile(params: {
    authorUsername: string;
    learningObjectId: string;
    file: FileUpload;
  }): Promise<void>;
  /**
   * Deletes a single file from a user's Learning Object
   *
   * @export
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the file to delete]
   *
   * @returns {Promise<void>}
   */
  deleteFile(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void>;
  /**
   * Deletes all contents within a user's Learning Object's folder
   *
   * @export
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {string} path [The path of the folder to delete]
   * @returns {Promise<void>}
   */
  deleteFolder(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void>;
}

/**
 * Module responsible for handling file operations
 *
 * @export
 * @class FileManager
 * @extends {ExpressServiceModule}
 */
@expressServiceModule({
  expressRouter: ExpressHttpAdapter.buildRouter(),
  providers: [
    { provide: FileManager, useClass: S3FileManager },
    { provide: LearningObjectGateway, useClass: ModuleLearningObjectGateway },
    { provide: FileMetadataGateway, useClass: FileMetadataModule },
  ],
})
export class FileManagerModule extends ExpressServiceModule
  implements FileManagerOperations {
  uploadFile = uploadFile;
  deleteFile = deleteFile;
  deleteFolder = deleteFolder;
}
