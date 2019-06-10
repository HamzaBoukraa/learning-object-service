import { LearningObject } from '../../shared/entity';
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
  CollectionAccessMap,
} from './query';

export {
  LearningObject,
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
};

export interface LearningObjectSearchResult {
  total: number;
  objects: LearningObject[];
}
