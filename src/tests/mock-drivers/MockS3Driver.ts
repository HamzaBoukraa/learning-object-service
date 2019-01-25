import { FileManager } from '../../interfaces/interfaces';
import {
    FileUpload, CompletedPartList,
} from '../../interfaces/FileManager';
import { MOCK_OBJECTS } from '../mocks';
import { CompletedPart } from 'aws-sdk/clients/s3';


export class MockS3Driver implements FileManager {
    streamFile(params: { path: string; objectName: string; }): import('stream').Readable {
        throw new Error('Method not implemented.');
    }
    hasAccess(path: string): Promise<boolean> {
        throw new Error('Method not implemented.');
    }
    initMultipartUpload(params: { path: string; }): Promise<string> {
        throw new Error('Method not implemented.');
    }
    abortMultipartUpload(params: { path: string; uploadId: string; }): Promise<void> {
        throw new Error('Method not implemented.');
    }
    upload(params: { file: FileUpload; }): Promise<string> {
        return Promise.resolve(MOCK_OBJECTS.S3_LOCATION);
    }

    delete(params: { path: string; }): Promise<void> {
        return Promise.resolve();
    }

    deleteAll(params: { path: string; }): Promise<void> {
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
}
