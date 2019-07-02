import { LearningObjectFile, FileMetadataFilter } from '../typings';
import { getFileMeta } from '../Interactor';
import { UserToken } from '../../shared/types';

export class FileMetadataAdapter {
    private static _instance: FileMetadataAdapter;
    private constructor() {

    }
    static open() {
        FileMetadataAdapter._instance = new FileMetadataAdapter();
    }
    static getInstance(): FileMetadataAdapter {
        if (this._instance) {
            return this._instance;
        }
        throw new Error('FileMetadataAdapter has not been created yet.');
    }

  /**
   * Proxies request for file metadata to
   * the FileMetadata interactor
   *
   * @abstract
   * @param {Requester} requester [Information about the requester]
   * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
   * @param {string} id [Id of the file meta to retrieve]
   *
   * @returns {Promise<LearningObjectFile>}
   */
    async getFileMeta(params: {
        requester: UserToken;
        learningObjectId: string;
        id: string;
        filter: FileMetadataFilter;
    }): Promise<LearningObjectFile> {
        return await getFileMeta(params);
    }
}
