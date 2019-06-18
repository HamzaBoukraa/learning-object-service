export interface AuthorSummary {
  id: string;
  username: string;
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
  revision: number;
  status: string;
}
