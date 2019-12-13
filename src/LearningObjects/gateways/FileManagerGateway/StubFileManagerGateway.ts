import { FileManagerGateway } from '../../interfaces';
import { FileUpload } from '../../../shared/types';
import { Requester } from '../../../Changelogs/typings';

export class StubFileManagerGateway implements FileManagerGateway {
  uploadFile(params: {
    authorUsername: string;
    learningObjectCUID: string;
    file: FileUpload;
  }): Promise<void> {
    return Promise.resolve();
  }
  deleteFile(params: {
    authorUsername: string;
    learningObjectCUID: string;
    path: string;
  }): Promise<void> {
    return Promise.resolve();
  }
  deleteFolder(params: {
    authorUsername: string;
    learningObjectCUID: string;
    path: string;
  }): Promise<void> {
    return Promise.resolve();
  }
  deleteAllFiles(params: {
    requester: Requester;
    learningObject: LearningObject;
  }): Promise<void> {
    return Promise.resolve();
  }
}
