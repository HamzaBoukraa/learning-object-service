/**
 * Define the database schema for learning objects.
 */
export interface LearningObjectDocument {
  _id?: string;
  authorID: string;
  name: string;
  description: string;
  date: string;
  length: string;
  levels: string[];
  materials: MaterialDocument;
  published: boolean;
  contributors: string[];
  children: string[];
  collection: string;
  lock?: LearningObjectLockDocument;
  status: string;
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
  url: string;
  date: string;
}

export interface LearningObjectLockDocument {
  date?: string;
  restrictions: string[];
}
export interface UrlDocument {
  title: string;
  url: string;
}
