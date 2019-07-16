import { UserToken } from './user-token';
import {
  LearningObjectUpdates,
  VALID_LEARNING_OBJECT_UPDATES,
} from './learning-object-updates';
import {
  LearningObjectDocument,
  MaterialDocument,
  FileDocument,
  UrlDocument,
} from './learning-object-document';
import { UserDocument } from './user-document';
import { LearningOutcomeDocument } from './learning-outcome-document';
import { StandardOutcomeDocument } from './standard-outcome-document';
import { ServiceToken } from './service-token';
import {
  LearningObjectSummary,
  AuthorSummary,
  LearningObjectChildSummary,
} from './learning-object-summary';
import { AccessGroup } from './access-groups';
import {
  ReleasedUserLearningObjectSearchQuery,
  UserLearningObjectQuery,
  UserLearningObjectSearchQuery,
} from './user-learning-object-query';
import { LearningObjectState } from './learning-object-state';
import { FileUpload } from './file-upload';
export interface CollectionAccessMap {
  [collection: string]: string[];
}

export {
  UserToken,
  ServiceToken,
  LearningObjectUpdates,
  VALID_LEARNING_OBJECT_UPDATES,
  UserDocument,
  LearningObjectDocument,
  MaterialDocument,
  FileDocument,
  UrlDocument,
  LearningOutcomeDocument,
  StandardOutcomeDocument,
  LearningObjectSummary,
  LearningObjectChildSummary,
  AuthorSummary,
  AccessGroup,
  UserLearningObjectQuery,
  ReleasedUserLearningObjectSearchQuery,
  UserLearningObjectSearchQuery,
  LearningObjectState,
  FileUpload,
};
