
import { FileManagerAdapter } from '../interfaces/FileManagerAdapter';
import { FileUpload } from '../typings/file-manager';
export class FileManagerAdapterStub implements FileManagerAdapter {
    private static _instance: FileManagerAdapter;
    private constructor() {}
    static open(): void {
        FileManagerAdapterStub._instance = new FileManagerAdapterStub();
    }

    static getInstance(): FileManagerAdapter {
        if (this._instance) {
            return this._instance;
        }
        throw new Error('FileManagerAdapter has not been created yet.');
    }
    async uploadFile(params: {
        file: FileUpload;
    }) {
        return Promise.resolve();
    }
}
