import { FileUpload } from '../../shared/types';

export abstract class FileManagerGateway {

  /**
   * Upload a single file
   *
   * @param {fileUpload} file [Object containing information about the file to upload ]
   * @memberof FileManagerGateway
   * @returns {Promise<void>}
   */
    abstract uploadFile(params: {
        file: FileUpload,
    }): Promise<void>;
}
