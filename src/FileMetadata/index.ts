import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { FileMetaDatastore, LearningObjectGateway } from './interfaces';
import { ExpressHttpAdapter } from './adapters';
import { MongoFileMetaDatastore, ModuleLearningObjectGateway } from './drivers';

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
export class FileMetadata extends ExpressServiceModule {}
