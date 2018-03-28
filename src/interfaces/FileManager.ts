export interface FileManager {
  upload(
    id: string,
    username: string,
    file: any[],
    directory: Map<string, Folder>
  ): Promise<LearningObjectFile[]>;
  delete(id: string, username: string, filename: string): Promise<void>;
  deleteAll(id: string, username: string): Promise<void>;
}

export type LearningObjectFile = {
  id: string;
  name: string;
  fileType: string;
  extension: string;
  url: string;
  date: string;
  relativePath?: string;
};

// TODO: Move to package
export type Folder = {
  id: string;
  name: string;
  subdirectories: string[];
  files: string[];
  parent?: string;
};
