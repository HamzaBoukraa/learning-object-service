import { FileMetadataGateway } from '../../interfaces';
import { UserToken } from '../../../shared/types';
import { FileMetadataFilter } from '../../../FileMetadata/typings';
import { LearningObject } from '../../../shared/entity';
import { promises } from 'dns';

export class StubFileMetadataGateway implements FileMetadataGateway {
  getFilePreviewUrl(params: {
    authorUsername: string;
    learningObjectId: string;
    unreleased: boolean;
    file: LearningObject.Material.File;
  }): string {
    return '';
  }
  getAllFileMetadata(params: {
    requester: UserToken;
    learningObjectId: string;
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
