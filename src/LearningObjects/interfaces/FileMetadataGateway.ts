import { UserToken } from '../../shared/types';
import { FileMetadataFilter } from '../../FileMetadata/typings';
import { LearningObject } from '../../shared/entity';

export abstract class FileMetadataGateway {

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
        filter: FileMetadataFilter
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
}
