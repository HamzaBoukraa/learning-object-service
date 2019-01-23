import { FileManager } from '../../interfaces/interfaces';
import {
    MultipartFileUpload,
    FileUpload, CompletedPartList,
    MultipartUploadData,
} from '../../interfaces/FileManager';
import { MOCK_OBJECTS } from '../mocks';


export class MockS3Driver implements FileManager {
    upload(params: { file: FileUpload; }): Promise<string> {
        return Promise.resolve(MOCK_OBJECTS.S3_LOCATION);
    }

    delete(params: { path: string; }): Promise<void> {
        return Promise.resolve();
    }

    deleteAll(params: { path: string; }): Promise<void> {
        return Promise.resolve();
    }
}
