import { CompletedPartList, CompletedPart } from 'aws-sdk/clients/s3';
import { Readable } from 'stream';

export interface FileManager {
  upload(params: { file: FileUpload }): Promise<string>;
  delete(params: { path: string }): Promise<void>;
  deleteAll(params: { path: string }): Promise<void>;
  processMultipart(params: {
    file: MultipartFileUpload;
    finish?: boolean;
    completedPartList?: CompletedPartList;
  }): Promise<MultipartUploadData>;
  cancelMultipart(params: { path: string; uploadId: string }): Promise<void>;
  streamFile(params: { path: string }): Readable;

  initMultipartUpload(params: { path: string }): Promise<string>;
  uploadPart(params: {
    path: string;
    data: any;
    partNumber: number;
    uploadId: string;
  }): Promise<CompletedPart>;
  completeMultipartUpload(params: {
    path: string;
    uploadId: string;
    completedPartList: CompletedPartList;
  }): Promise<string>;
}

// Export aliased types for ease of update in the case that AWS S3 is no longer the driver used.
export type CompletedPartList = CompletedPartList;
export type CompletedPart = CompletedPart;

export interface FileUpload {
  path: string;
  data: any;
}

export interface MultipartFileUpload extends FileUpload {
  partNumber: number;
  uploadId: string;
}

export interface MultipartFileUploadStatus {
  _id: string;
  uploadId: string;
  path: string;
  completedParts: CompletedPartList;
  createdAt: string;
}
export interface MultipartFileUploadStatusUpdates {
  partsUploaded: number;
  bytesUploaded: number;
}

export interface MultipartUploadData {
  uploadId?: string;
  url?: string;
  completedPart?: CompletedPart;
}

export interface DZFileMetadata {
  dzuuid?: string;
  dzchunkindex?: number;
  dztotalfilesize?: number;
  dzchunksize?: number;
  size?: number;
  dztotalchunkcount?: number;
  dzchunkbyteoffset?: number;
  fullPath: string;
}

export interface DZFile extends DZFileMetadata {
  name: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}
