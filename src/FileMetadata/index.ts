import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { FileMetaDatastore, LearningObjectGateway } from './interfaces';
import { MongoFileMetaDatastore, ModuleLearningObjectGateway } from './drivers';
import { deleteAllFileMeta } from './Interactor';

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
  static deleteAllFileMetadata = deleteAllFileMeta;
}
