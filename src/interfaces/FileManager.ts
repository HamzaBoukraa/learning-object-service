export interface FileManager {
  upload(
    id: string,
    username: string,
    file: any[],
    filePathMap: Map<string, string>
  ): Promise<LearningObjectFile[]>;
  delete(id: string, username: string, filename: string): Promise<void>;
  deleteAll(id: string, username: string): Promise<void>;
}

// TODO: Move to package
export type LearningObjectFile = {
  id: string;
  name: string;
  fileType: string;
  extension: string;
  url: string;
  date: string;
  fullPath?: string;
};
