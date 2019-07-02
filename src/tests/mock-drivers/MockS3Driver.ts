import { FileManager } from '../../shared/interfaces/interfaces';
import { FileUpload, CompletedPartList } from '../../FileManager/interfaces/FileManager';
import { CompletedPart } from 'aws-sdk/clients/s3';
import { Readable } from 'stream';

export class MockS3Driver implements FileManager {
  streamWorkingCopyFile(params: { path: string }): Readable {
    return new Readable();
  }
  copyToReleased(params: {
    srcFolder: string;
    destFolder: string;
  }): Promise<void> {
    return Promise.resolve();
  }
  streamFile(params: { path: string }): Readable {
    return new Readable();
  }
  hasAccess(path: string): Promise<boolean> {
    return Promise.resolve(true);
  }
  initMultipartUpload(params: { path: string }): Promise<string> {
    return Promise.resolve('');
  }
  abortMultipartUpload(params: {
    path: string;
    uploadId: string;
  }): Promise<void> {
    return Promise.resolve();
  }
  upload(params: { file: FileUpload }): Promise<string> {
    return Promise.resolve('http://s3.amazonaws.com/doc/2006-03-01/');
  }

  delete(params: { path: string }): Promise<void> {
    return Promise.resolve();
  }

  deleteAll(params: { path: string }): Promise<void> {
    return Promise.resolve();
  }
  uploadPart(params: {
    path: string;
    data: any;
    partNumber: number;
    uploadId: string;
  }): Promise<CompletedPart> {
    throw new Error('Method not implemented.');
  }
  completeMultipartUpload(params: {
    path: string;
    uploadId: string;
    completedPartList: CompletedPartList;
  }): Promise<string> {
    throw new Error('Method not implemented.');
  }

  deleteFolder(params: { path: string; }): Promise<void> {
    return Promise.resolve();
  }
}
