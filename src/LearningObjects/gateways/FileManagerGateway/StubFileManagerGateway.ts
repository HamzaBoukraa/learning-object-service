import { FileManagerGateway } from '../../interfaces';
import { FileUpload } from '../../../shared/types';

export class StubFileManagerGateway implements FileManagerGateway {
  uploadFile(params: {
    authorUsername: string;
    learningObjectId: string;
    file: FileUpload;
  }): Promise<void> {
    return Promise.resolve();
  }
  deleteFile(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void> {
    return Promise.resolve();
  }
  deleteFolder(params: {
    authorUsername: string;
    learningObjectId: string;
    path: string;
  }): Promise<void> {
    return Promise.resolve();
  }
}
