import {
  expressServiceModule,
  ExpressServiceModule,
} from 'node-service-module';
import { ExpressHttpAdapter } from './adapters';
import {
  uploadFile,
  deleteFile,
  deleteFolder,
  getFileStream,
} from './interactors/Interactor';
import {
  FileManager,
  LearningObjectGateway,
  FileMetadataGateway,
} from './interfaces';
import { S3FileManager } from './drivers';
import {
  ModuleLearningObjectGateway,
  ModuleFileMetadataGateway,
} from './gateways';
import { ModuleHierarchyGateway, HierarchyGateway } from './gateways/HierarchyGateway/ModuleHierarchyGateway';
import { duplicateRevisionFiles } from './interactors/duplicateRevisionFiles/duplicateRevisionFiles';
import { deleteAllFiles } from './interactors/deleteAllFiles/deleteAllFiles';

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
    { provide: FileMetadataGateway, useClass: ModuleFileMetadataGateway },
    { provide: HierarchyGateway, useClass: ModuleHierarchyGateway },
  ],
})
export class FileManagerModule extends ExpressServiceModule {
  static getFileStream = getFileStream;
  static uploadFile = uploadFile;
  static deleteFile = deleteFile;
  static deleteFolder = deleteFolder;
  static duplicateRevisionFiles = duplicateRevisionFiles;
  static deleteAllFiles = deleteAllFiles;
}
