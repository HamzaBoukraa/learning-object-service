import { FileUpload } from '../typings/file-manager';

export abstract class FileManagerAdapter {

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
      abstract uploadFile(params: {
          file: FileUpload;
      }): Promise<void>;
  }
