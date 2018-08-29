export interface FileManager {
  upload(path: string, file: any): Promise<string>;
  delete(path: string): Promise<void>;
  deleteAll(path: string): Promise<void>;
}
