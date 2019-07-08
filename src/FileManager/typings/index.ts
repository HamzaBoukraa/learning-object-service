import { CompletedPartList, CompletedPart } from 'aws-sdk/clients/s3';
import {UserToken, AccessGroup, FileUpload} from '../../shared/types';

// Export aliased types for ease of update in the case that AWS S3 is no longer the driver used.
export type CompletedPart = CompletedPart;
export type CompletedPartList = CompletedPartList;

export type DownloadFilter = 'released' | 'unreleased';

export {UserToken as Requester, AccessGroup, FileUpload}
