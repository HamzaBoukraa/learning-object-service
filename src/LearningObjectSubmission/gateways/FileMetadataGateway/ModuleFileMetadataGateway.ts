import { FileMetadataGateway } from '../../interfaces/FileMetadataGateway';
import { UserToken } from '../../../shared/types';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { LearningObject } from '../../../shared/entity';
import { FileMetadataModule } from '../../../FileMetadata/FileMetadataModule';

export class ModuleFileMetadataGateway implements FileMetadataGateway {
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
    filter: FileMetadataFilter;
  }): Promise<LearningObject.Material.File[]> {
    return FileMetadataModule.getAllFileMetadata(params);
  }
}
