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
} from './Interactor';
import { ExpressHttpAdapter } from './adapters';
import { ModuleLearningObjectGateway } from './gateways';
import { FileManagerModule } from '../FileManager/FileManagerModule';
import { Requester, FileMetadataFilter, LearningObjectFile } from './typings';

export interface FileMetadataOperations {
  /**
   * Retrieves file metadata by id
   *
   * Allows file metadata to be filtered by released and unreleased
   *
   * @param {Requester} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   * @param {string} id [Id of the file meta to retrieve]
   *
   * @returns {Promise<LearningObjectFile>}
   */
  getFileMetadata(params: {
    requester: Requester;
    learningObjectId: string;
    id: string;
    filter?: FileMetadataFilter;
  }): Promise<LearningObjectFile>;

  /**
   * Retrieves all file metadata that belongs to a Learning Object
   *
   * Allows file metadata to be filtered by released and unreleased
   *
   * @param {Requester} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   * @param {number} learningObjectRevision [The revision number of the Learning Object]
   * @returns {Promise<LearningObjectFile[]>}
   */
  getAllFileMetadata(params: {
    requester: Requester;
    learningObjectId: string;
    filter?: FileMetadataFilter;
  }): Promise<LearningObjectFile[]>;

  /**
   * Deletes all file metadata documents for a Learning Object
   *
   * @param {Requester} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   *
   * @returns {Promise<void>}
   */
  deleteAllFileMetadata(params: {
    requester: Requester;
    learningObjectId: string;
  }): Promise<void>;
}

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
    { provide: FileManagerGateway, useClass: FileManagerModule },
  ],
})
export class FileMetadataModule extends ExpressServiceModule
  implements FileMetadataOperations {
  getFileMetadata = getFileMetadata;
  getAllFileMetadata = getAllFileMetadata;
  deleteAllFileMetadata = deleteAllFileMetadata;
}
