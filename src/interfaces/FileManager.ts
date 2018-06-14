import { File } from '@cyber4all/clark-entity/dist/learning-object';
export interface FileManager {
  upload(id: string, username: string, file: any): Promise<LearningObjectFile>;
  uploadMultiple(
    id: string,
    username: string,
    file: any[],
  ): Promise<LearningObjectFile[]>;
  delete(id: string, username: string, filename: string): Promise<void>;
  deleteAll(id: string, username: string): Promise<void>;
}

export type LearningObjectFile = File;
