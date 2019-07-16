import { FileMetadataGateway } from '../../interfaces';
import { UserToken } from '../../../shared/types';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { LearningObject } from '../../../shared/entity';

export class StubFileMetadataGateway implements FileMetadataGateway {
  getAllFileMetadata(params: {
    requester: UserToken;
    learningObjectId: string;
    filter: FileMetadataFilter;
  }): Promise<LearningObject.Material.File[]> {
    return Promise.resolve([]);
  }
  deleteAllFileMetadata(params: {
    requester: UserToken;
    learningObjectId: string;
  }): Promise<void> {
    return Promise.resolve();
  }
}
