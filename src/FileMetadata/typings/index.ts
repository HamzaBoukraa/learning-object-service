import { LearningObject } from '../../shared/entity';
import {
  FileMetadata,
  FileMetadataInsert,
  FileMetadataUpdate,
  FileMetadataDocument,
} from './file-metadata';
import { UserToken, LearningObjectSummary } from '../../shared/types';

export type LearningObjectFile = LearningObject.Material.File;
export import LearningObjectStatus = LearningObject.Status;

export type FileMetadataFilter = 'released' | 'unreleased';

export { UserToken as Requester };

export {
  FileMetadata,
  FileMetadataInsert,
  FileMetadataUpdate,
  FileMetadataDocument,
  LearningObjectSummary,
};
