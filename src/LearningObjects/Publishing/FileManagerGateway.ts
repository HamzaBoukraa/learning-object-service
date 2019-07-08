import { FileUpload } from '../../shared/types';

export abstract class FileManagerGateway {

    /**
     * Uploads file to storage
     *
     * @abstract
     * @param {FileUpload} file [The file upload data object]
     * @returns {Promise<void>}
     * @memberof FileManagerGateway
     */
    abstract uploadFile(params: { file: FileUpload }): Promise<void>;
}

