import { CompletedPartList, CompletedPart } from 'aws-sdk/clients/s3';

// Export aliased types for ease of update in the case that AWS S3 is no longer the driver used.
export type CompletedPart = CompletedPart;
export type CompletedPartList = CompletedPartList;

export interface FileUpload {
    path: string;
    // FIXME: This should define the specific types it can take
    data: any;
  }

export interface MultipartFileUpload extends FileUpload {
    partNumber: number;
    uploadId: string;
}

export interface MultipartFileUploadStatus {
    _id: string;
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
