import { LearningObject } from '../../shared/entity';
import { UserToken as Requester } from '../../shared/types/user-token';
import {
  ElasticSearchQuery,
  FilteredElasticSearchQuery,
  PostFilterQuery,
} from './elastic-search';
import {
  Filters,
  LearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
} from './query';

export {
  LearningObject,
  Requester,
  ElasticSearchQuery,
  PostFilterQuery,
  FilteredElasticSearchQuery,
  Filters,
  LearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
};

export interface LearningObjectSearchResult {
  total: number;
  objects: LearningObject[];
}

export interface CollectionAccessMap {
  [index: string]: string[];
}
