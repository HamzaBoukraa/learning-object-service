export interface Filters {
  orderBy?: string;
  sortType?: -1 | 1;
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
export interface QueryCondition {
  [index: string]: string | string[];
}

export interface LearningObjectSearchQuery extends ReleasedLearningObjectSearchQuery {
  status?: string[];
  conditions?: QueryCondition[];
}
