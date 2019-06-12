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
  CollectionAccessMap,
} from './query';

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
};

export interface AuthorSummary {
  id: string;
  name: string;
  organization: string;
}

export interface LearningObjectSummary {
  id: string;
  author: AuthorSummary;
  collection: string;
  contributors: AuthorSummary[];
  date: string;
  description: string;
  length: string;
  name: string;
  status: string;
}

export interface LearningObjectSearchResult {
  total: number;
  objects: LearningObjectSummary[];
}
