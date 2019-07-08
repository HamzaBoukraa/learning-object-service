import { UserToken, FileUpload } from '../../shared/types';
import { FileMetadataFilter } from '../../FileMetadata/typings';
import { LearningObject } from '../../shared/entity';


export abstract class FileManagerGateway {

   /**
    * Uploads a file to a user's Learning Object
    *
    * @abstract
    * @param {string} authorUsername [The Learning Object's author's username]
    * @param {string} learningObjectId [The id of the Learning Object to upload file to]
    * @param {FileUpload} file [Data specifiying what to upload and the path the data should exist at]
    * @returns {Promise<void>}
    */
    abstract uploadFile(params: {
        authorUsername: string;
        learningObjectId: string;
        file: FileUpload;
    }): Promise<void>;

    /**
     * Deletes the file at the specified path from a user's Learning Object
     *
     * @abstract
     * @param {string} authorUsername [The Learning Object's author's username]
     * @param {string} learningObjectId [The id of the Learning Object to upload file to]
     * @param {string} path [The path of the file to delete]
     * @returns {Promise<void>}
     */
    abstract deleteFile(params: {
        authorUsername: string;
        learningObjectId: string;
        path: string;
    }): Promise<void>;

    /**
     * Deletes the folder at the specified path from a user's Learning Object
     *
     * @abstract
     * @param {string} authorUsername [The Learning Object's author's username]
     * @param {string} learningObjectId [The id of the Learning Object to upload file to]
     * @param {string} path [The path of the folder to delete]
     * @returns {Promise<void>}
     */
    abstract deleteFolder(params: {
        authorUsername: string;
        learningObjectId: string;
        path: string;
    }): Promise<void>;
}
