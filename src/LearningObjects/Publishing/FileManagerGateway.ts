import { FileUpload } from '../../shared/types';

export abstract class FileManagerGateway {

    /**
     * Uploads file to storage
     *
     * @abstract
     * @param {string} authorUsername [The Learning Object's author's username]
     * @param {string} learningObjectId [The id of the Learning Object to upload file to]
     * @param {FileUpload} file [The file upload data object]
     * @returns {Promise<void>}
     * @memberof FileManagerGateway
     */
    abstract uploadFile(params: { authorUsername: string, learningObjectId: string, file: FileUpload }): Promise<void>;
}

