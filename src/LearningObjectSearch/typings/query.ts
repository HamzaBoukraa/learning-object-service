import { LearningObject } from '.';

export type SortOrder = 1 | -1;

export interface Filters {
  orderBy?: string;
  sortType?: SortOrder;
  page?: number;
  limit?: number;
}

export interface ReleasedLearningObjectSearchQuery extends Filters {
  name?: string;
  author?: string;
  length?: string[];
  level?: string[];
  standardOutcomeIDs?: string[];
  text?: string;
  collection?: string[];
}

export interface LearningObjectSearchQuery
  extends ReleasedLearningObjectSearchQuery {
  status?: string[];
}

export interface PrivilegedLearningObjectSearchQuery
  extends LearningObjectSearchQuery {
  collectionRestrictions?: CollectionAccessMap;
}

export interface CollectionAccessMap {
  [collection: string]: LearningObject.Status[];
}
