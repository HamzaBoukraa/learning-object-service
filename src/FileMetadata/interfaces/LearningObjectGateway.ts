import {
  LearningObjectSummary,
  Requester,
  LearningObjectFile,
} from '../typings';

export abstract class LearningObjectGateway {
  /**
   * Retrieves a summary of the working copy Learning Object
   *
   * @param {Requester} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectSummary>}
   */
  abstract getWorkingLearningObjectSummary(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectSummary>;
  /**
   * Retrieves released Learning Object file metadata by id
   *
   * @param {Requester} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @param {string} fileId [Id of the file]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectFile>}
   */
  abstract getReleasedFile(params: {
    requester: Requester;
    id: string;
    fileId: string;
  }): Promise<LearningObjectFile>;
  /**
   * Retrieves all released Learning Object file metadata
   *
   * @param {Requester} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @memberof LearningObjectGateway
   * @returns {Promise<LearningObjectFile[]>}
   */
  abstract getReleasedFiles(params: {
    requester: Requester;
    id: string;
  }): Promise<LearningObjectFile[]>;
}
