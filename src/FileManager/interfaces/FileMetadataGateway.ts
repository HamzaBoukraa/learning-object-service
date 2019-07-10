import {
  Requester,
  FileMetadataFilter,
  LearningObjectFile,
} from '../../FileMetadata/typings';
import { FileMetadataOperations } from '../../FileMetadata/FileMetadataModule';

export abstract class FileMetadataGateway
  implements Partial<FileMetadataOperations> {
  /**
   * Retrieves file metadata for Learning Object by file id
   *
   * @abstract
   * @param {Requester} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   * @param {string} id [Id of the file meta to retrieve]
   *
   * @returns {Promise<LearningObjectFile>}
   */
  abstract getFileMetadata(params: {
    requester: Requester;
    learningObjectId: string;
    id: string;
    filter: FileMetadataFilter;
  }): Promise<LearningObjectFile>;
}
