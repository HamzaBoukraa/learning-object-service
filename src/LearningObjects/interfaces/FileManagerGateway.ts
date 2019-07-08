import { UserToken, FileUpload } from '../../shared/types';
import { FileMetadataFilter } from '../../FileMetadata/typings';
import { LearningObject } from '../../shared/entity';


export abstract class FileManagerGateway {

   /**
    * Uploads a file
    *
    * @abstract
    * @param {FileUpload} file [Data specifiying what to upload and the path the data should exist at]
    * @returns {Promise<void>}
    */
    abstract uploadFile(params: {
        file: FileUpload;
    }): Promise<void>;

    /**
     * Deletes the file at the specified path
     *
     * @abstract
     * @param {string} path [The path of the file to delete]
     * @returns {Promise<void>}
     */
    abstract deleteFile(params: {
        path: string;
    }): Promise<void>;

    /**
     * Deletes the folder at the specified path
     *
     * @abstract
     * @param {string} path [The path of the folder to delete]
     * @returns {Promise<void>}
     */
    abstract deleteFolder(params: {
        path: string;
    }): Promise<void>;
}
