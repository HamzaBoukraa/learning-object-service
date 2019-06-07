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
  ReleasedLearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
  CollectionAccessMap,
} from './query';

export {
  LearningObject,
  Requester,
  ElasticSearchQuery,
  PostFilterQuery,
  FilteredElasticSearchQuery,
  Filters,
  LearningObjectSearchQuery,
  ReleasedLearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
  CollectionAccessMap,
};

export interface LearningObjectSearchResult {
  total: number;
  objects: LearningObject[];
}
