import { LearningObject, User } from '../../shared/entity';
import { UserToken as Requester } from '../../shared/types/user-token';
import {
  ElasticSearchQuery,
  SortOperation,
  BoolOperation,
  MultiMatchQuery,
  MatchPhrasePrefixQuery,
  TermQuery,
  TermsQuery,
} from './elastic-search';
import {
  Filters,
  SortOrder,
  LearningObjectSearchQuery,
  ReleasedLearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
} from './query';
import {
  LearningObjectSummary,
  AuthorSummary,
  CollectionAccessMap,
} from '../../shared/types';

export {
  LearningObject,
  User,
  Requester,
  ElasticSearchQuery,
  SortOperation,
  BoolOperation,
  MultiMatchQuery,
  MatchPhrasePrefixQuery,
  TermQuery,
  TermsQuery,
  Filters,
  SortOrder,
  LearningObjectSearchQuery,
  ReleasedLearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
  CollectionAccessMap,
  LearningObjectSummary,
  AuthorSummary,
};

export interface LearningObjectSearchResult {
  total: number;
  objects: LearningObjectSummary[];
}
