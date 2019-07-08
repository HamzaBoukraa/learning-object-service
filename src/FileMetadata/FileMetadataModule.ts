import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { FileMetaDatastore, LearningObjectGateway, FileManagerGateway } from './interfaces';
import { MongoFileMetaDatastore } from './drivers';
import { deleteAllFileMeta, getFileMeta, getAllFileMeta } from './Interactor';
import { ExpressHttpAdapter } from './adapters';
import { ModuleLearningObjectGateway, ModuleFileManagerGateway } from './gateways';

/**
 * Module responsible for handling the management of file metadata
 *
 * @export
 * @class FileMetadata
 * @extends {ExpressServiceModule}
 */
@expressServiceModule({
  expressRouter: ExpressHttpAdapter.buildRouter(),
  providers: [
    { provide: FileMetaDatastore, useClass: MongoFileMetaDatastore },
    { provide: LearningObjectGateway, useClass: ModuleLearningObjectGateway },
    { provide: FileManagerGateway, useClass: ModuleFileManagerGateway },
  ],
})
export class FileMetadataModule extends ExpressServiceModule {
  static getFileMetadata = getFileMeta;
  static getAllFileMetadata = getAllFileMeta;
  static deleteAllFileMetadata = deleteAllFileMeta;
}
