import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { FileMetaDatastore, LearningObjectGateway } from './interfaces';
import { MongoFileMetaDatastore, ModuleLearningObjectGateway } from './drivers';
import { deleteAllFileMeta, getFileMeta, getAllFileMeta } from './Interactor';
import { ExpressHttpAdapter } from './adapters';

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
  ],
})
export class FileMetadata extends ExpressServiceModule {
  static getFileMetadata = getFileMeta;
  static getAllFileMetadata = getAllFileMeta;
  static deleteAllFileMetadata = deleteAllFileMeta;
}
