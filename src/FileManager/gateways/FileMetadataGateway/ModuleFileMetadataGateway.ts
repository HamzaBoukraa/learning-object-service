import { FileMetadataGateway } from '../../interfaces';
import { Requester } from '../../typings';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { LearningObject } from '../../../shared/entity';
import { FileMetadataModule } from '../../../FileMetadata/FileMetadataModule';

export class ModuleFileMetadataGateway implements FileMetadataGateway {
  /**
   * @inheritdoc
   *
   *
   * Proxies FileMetadataModule's `getFileMetadata`
   *
   * @returns {Promise<LearningObject.Material.File>}
   * @memberof ModuleFileMetadataGateway
   */
  getFileMetadata(params: {
    requester: Requester;
    learningObjectId: string;
    fileId: string;
    filter: FileMetadataFilter;
  }): Promise<LearningObject.Material.File> {
    return FileMetadataModule.getFileMetadata(params);
  }
}
