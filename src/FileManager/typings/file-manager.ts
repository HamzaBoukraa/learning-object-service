import { CompletedPartList, CompletedPart } from 'aws-sdk/clients/s3';

// Export aliased types for ease of update in the case that AWS S3 is no longer the driver used.
export type CompletedPart = CompletedPart;
export type CompletedPartList = CompletedPartList;

export interface FileUpload {
    path: string;
    // FIXME: This should define the specific types it can take
    data: any;
}

export type DownloadFilter = 'released' | 'unreleased';
