import { FileUpload } from '../shared/interfaces/FileManager';
import { FileManagerAdapter } from './FileManagerAdapter';
export class FileManagerAdapterStub extends FileManagerAdapter {
    async uploadFile(params: {
        file: FileUpload;
    }) {
        return Promise.resolve();
    }
}
