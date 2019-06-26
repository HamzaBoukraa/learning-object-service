import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { FileMetaDatastore, LearningObjectGateway } from './interfaces';
import { MongoFileMetaDatastore, ModuleLearningObjectGateway } from './drivers';
import { deleteAllFileMeta, getFileMeta, getAllFileMeta } from './Interactor';

/**
 * Module responsible for handling the management of file metadata
 *
 * @export
 * @class FileMetadata
 * @extends {ExpressServiceModule}
 */
@expressServiceModule({
  expressRouter: null,
  providers: [
    { provide: FileMetaDatastore, useClass: MongoFileMetaDatastore },
    { provide: LearningObjectGateway, useClass: ModuleLearningObjectGateway },
  ],
})
export class FileMetadata extends ExpressServiceModule {
  static geFileMetadata = getFileMeta;
  static getAllFileMetadata = getAllFileMeta;
  static deleteAllFileMetadata = deleteAllFileMeta;
}
