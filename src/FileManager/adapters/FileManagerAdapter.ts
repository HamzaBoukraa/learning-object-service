import { uploadFile } from '../Interactor';
import { FileUpload } from '../typings/file-manager';
import { FileManagerAdapter as FileManagerAdapterInterface } from '../interfaces/FileManagerAdapter';
export class FileManagerAdapter implements FileManagerAdapterInterface {
    private static _instance: FileManagerAdapter;
    private constructor() {}
    static open(): void {
        FileManagerAdapter._instance = new FileManagerAdapter();
    }

    static getInstance(): FileManagerAdapter {
        if (this._instance) {
            return this._instance;
        }
        throw new Error('FileManagerAdapter has not been created yet.');
    }

    /**
     * Proxies request to FileInteractor uploadFile function
     *
     * @export
     * @param {{ FileUpload }} file
     * @returns {string}
     */
    async uploadFile(params: {
        file: FileUpload,
    }) {
        return await uploadFile({
            file: params.file,
        });
    }
}
