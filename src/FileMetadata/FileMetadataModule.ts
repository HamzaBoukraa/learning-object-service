import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import {
  FileMetaDatastore,
  LearningObjectGateway,
  FileManagerGateway,
} from './interfaces';
import { MongoFileMetaDatastore } from './drivers';
import {
  deleteAllFileMetadata,
  getFileMetadata,
  getAllFileMetadata,
  getFilePreviewURL,
  deleteAllS3Files,
} from './interactors';
import { ExpressHttpAdapter } from './adapters';
import {
  ModuleLearningObjectGateway,
  ModuleFileManagerGateway,
} from './gateways';
import { LearningObjectFile } from './typings';

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
  static getFilePreviewUrl = ({
    authorUsername,
    learningObjectId,
    unreleased,
    file,
  }: {
    authorUsername: string;
    learningObjectId: string;
    unreleased?: boolean;
    file: LearningObjectFile;
  }) =>
    getFilePreviewURL({
      authorUsername,
      learningObjectId,
      unreleased,
      fileId: file.id,
      extension: file.extension,
    })
  static getFileMetadata = getFileMetadata;
  static getAllFileMetadata = getAllFileMetadata;
  static deleteAllFileMetadata = deleteAllFileMetadata;
  static deleteAllS3Files = deleteAllS3Files;
}
