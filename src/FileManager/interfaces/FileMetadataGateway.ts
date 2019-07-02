import {
    Requester,
    FileMetadataFilter,
    LearningObjectFile,
} from '../../FileMetadata/typings';

export abstract class FileMetadataGateway {

  /**
   * Proxies request for file metadata to
   * the FileMetadata module
   *
   * @abstract
   * @param {Requester} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   * @param {string} id [Id of the file meta to retrieve]
   *
   * @returns {Promise<LearningObjectFile>}
   */
    abstract getFileMeta(params: {
        requester: Requester;
        learningObjectId: string;
        id: string;
        filter: FileMetadataFilter
    }): Promise<LearningObjectFile>;
}
