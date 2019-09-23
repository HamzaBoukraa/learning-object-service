import { FileMetadataGateway } from '../../interfaces';
import { UserToken } from '../../../shared/types';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { LearningObject } from '../../../shared/entity';
import { FileMetadataModule } from '../../../FileMetadata/FileMetadataModule';

export class ModuleFileMetadataGateway implements FileMetadataGateway {
  /**
   * @inheritdoc
   *
   * Proxies FileMetadataModule's `getFilePreviewUrl`
   *
   * @returns {string}
   * @memberof ModuleFileMetadataGateway
   */
  getFilePreviewUrl(params: {
    authorUsername: string;
    learningObjectId: string;
    unreleased: boolean;
    file: LearningObject.Material.File;
  }): string {
    return FileMetadataModule.getFilePreviewUrl(params);
  }
  /**
   * @inheritdoc
   *
   *
   * Proxies FileMetadataModule's `getAllFileMetadata`
   *
   * @returns {Promise<LearningObject.Material.File>}
   * @memberof ModuleFileMetadataGateway
   */
  getAllFileMetadata(params: {
    requester: UserToken;
    learningObjectId: string;
  }): Promise<LearningObject.Material.File[]> {
    return FileMetadataModule.getAllFileMetadata(params);
  }
  /**
   * @inheritdoc
   *
   *
   * Proxies FileMetadataModule's `deleteAllFileMetadata`
   *
   * @returns {Promise<LearningObject.Material.File>}
   * @memberof ModuleFileMetadataGateway
   */
  deleteAllFileMetadata(params: {
    requester: UserToken;
    learningObjectId: string;
  }): Promise<void> {
    return FileMetadataModule.deleteAllFileMetadata(params);
  }
}
