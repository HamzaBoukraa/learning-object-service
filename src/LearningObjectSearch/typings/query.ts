export interface Filters {
  orderBy?: string;
  sortType?: -1 | 1;
  page?: number;
  limit?: number;
}

export interface LearningObjectSearchQuery extends Filters {
  name?: string;
  author?: string;
  length?: string[];
  level?: string[];
  standardOutcomeIDs?: string[];
  text?: string;
  collection?: string[];
}

export interface PrivilegedLearningObjectSearchQuery
  extends LearningObjectSearchQuery {
  collectionRestrictions?: string[];
}
