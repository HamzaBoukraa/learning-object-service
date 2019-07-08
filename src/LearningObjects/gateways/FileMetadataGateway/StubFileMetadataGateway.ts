import { FileMetadataGateway } from '../../interfaces';
import { LearningObject } from '../../../shared/entity';

export class StubFileMetadataGateway implements FileMetadataGateway {
  getAllFileMetadata(params: any): Promise<LearningObject.Material.File[]> {
    return Promise.resolve([]);
  }
  deleteAllFileMetadata(params: any): Promise<void> {
    return Promise.resolve();
  }
}
