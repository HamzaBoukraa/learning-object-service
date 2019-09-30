/**
 * Define the database schema for learning objects.
 */
export interface LearningObjectDocument {
  _id: string;
  // TODO make property non-optional when database is back-filled with CUIDs
  cuid?: string;
  authorID: string;
  name: string;
  description: string;
  date: string;
  length: string;
  levels: string[];
  materials: MaterialDocument;
  contributors: string[];
  children: string[];
  collection: string;
  status: string;
  hasRevision?: boolean;
  revision: number;
  isRevision?: boolean;
}

export interface ReleasedLearningObjectDocument extends LearningObjectDocument {
  outcomes: OutcomeDocument[];
}

export interface ReleasedLearningObjectDocument {
  _id: string;
  // TODO make property non-optional when database is back-filled with CUIDs
  cuid?: string;
  authorID: string;
  name: string;
  description: string;
  date: string;
  length: string;
  levels: string[];
  materials: MaterialDocument;
  contributors: string[];
  children: string[];
  collection: string;
  outcomes: OutcomeDocument[];
  status: string;
  hasRevision?: boolean;
  revision: number;
}

export interface MaterialDocument {
  files: FileDocument[];
  urls: UrlDocument[];
  notes: string;
}
export interface FileDocument {
  id: string;
  name: string;
  fileType: string;
  date: string;
}
export interface UrlDocument {
  title: string;
  url: string;
}

export interface OutcomeDocument {
  id: string;
  outcome: string;
  bloom: string;
  verb: string;
  text: string;
  mappings: string[];
}
