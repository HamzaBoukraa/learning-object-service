import { FileManager } from '../shared/interfaces/interfaces';
import { uploadFile } from './FileInteractor';
import { FileUpload } from '../shared/interfaces/FileManager';
export class FileManagerAdapter {
    private static _instance: FileManagerAdapter;
    private constructor(
        private fileManager: FileManager,
    ) {}
    static open(fileManager: FileManager): void {
        FileManagerAdapter._instance = new FileManagerAdapter(
            fileManager,
        );
    }

    static getInstance(): FileManagerAdapter {
        if (this._instance) {
            return this._instance;
        }
        throw new Error('FileManagerAdapter has not been created yet.');
    }

    /**
     * Instructs file manager to upload a single file
     *
     * @export
     * @param {{ FileManager }} fileManager
     * @param {{ FileUpload }} file
     * @returns {string}
     */
    async uploadfile(params: {
        fileManager: FileManager,
        file: FileUpload,
    }) {
        return await uploadFile({
            fileManager: params.fileManager,
            file: params.file,
        });
    }
}
