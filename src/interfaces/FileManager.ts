export interface FileManager {
  upload(
    id: string,
    username: string,
    file: any[]
  ): Promise<LearningObjectFile[]>;
  delete(id: string, username: string, filename: string): Promise<void>;
  deleteAll(id: string, username: string): Promise<void>;
}

export type LearningObjectFile = {
  name: string;
  fileType: string;
  extension: string;
  url: string;
  date: string;
  description: number;
};
