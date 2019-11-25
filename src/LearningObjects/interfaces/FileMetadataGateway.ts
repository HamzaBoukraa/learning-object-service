import { UserToken } from '../../shared/types';
import { FileMetadataFilter } from '../../FileMetadata/typings';
import { LearningObject } from '../../shared/entity';

export abstract class FileMetadataGateway {
  /**
   * Retrieves preview url for a given file
   *
   * @abstract
   * @param {string} authorUsername [Username of the author of the LearningObject the file meta belongs to]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   * @param {boolean} unreleased [Flag indicating whether or not to return the unreleased preview url]
   * @param {LearningObject.Material.File} [The file to get a preview url for]
   * @returns {string}
   * @memberof FileMetadataGateway
   */
  abstract getFilePreviewUrl(params: {
    authorUsername: string;
    learningObjectId: string;
    unreleased?: boolean;
    file: LearningObject.Material.File;
  }): string;
  /**
   * Retrieves all file metadata for a Learning Object
   *
   * @abstract
   * @param {UserToken} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   *
   * @returns {Promise<LearningObject.Material.File>}
   */
  abstract getAllFileMetadata(params: {
    requester: UserToken;
    learningObjectId: string;
  }): Promise<LearningObject.Material.File[]>;

  /**
   * Deletes all file metadata for a Learning Object
   *
   * @abstract
   * @param {UserToken} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   *
   * @returns {Promise<void>}
   */
  abstract deleteAllFileMetadata(params: {
    requester: UserToken;
    learningObjectId: string;
  }): Promise<void>;

  /**
   * Deletes all files associated with the Learning Object from S3
   *
   * @param {UserToken} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the learningObject the file belongs to]
   *
   * @returns {Promise<void>}
   */
  abstract deleteAllS3Files(params: {
    requester: UserToken;
    learningObjectId: string;
  }): Promise<void>;
}
