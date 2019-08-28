import { DataStore } from '../../shared/interfaces/DataStore';
import { LearningObject } from '../../shared/entity';
import { LibraryCommunicator } from '../../shared/interfaces/interfaces';
import {
  getActiveLearningObjectSummary,
  getLearningObjectById,
  getReleasedFile,
  getReleasedFiles,
  getReleasedLearningObjectSummary,
  getWorkingLearningObjectSummary,
  updateLearningObject,
  updateObjectLastModifiedDate,
  updateReadme,
  getLearningObjectByName,
} from '../LearningObjectInteractor';
import { LearningObjectSummary, UserToken } from '../../shared/types';
import { LearningObjectFilter } from '../typings';

/**
 * FIXME: THe duplication of JSDoc comments here is not ideal, as it means a change
 * must take place in two places.
 */
export class LearningObjectAdapter {
  private static _instance: LearningObjectAdapter;
  private constructor(
    private dataStore: DataStore,
    private library: LibraryCommunicator,
  ) {}
  static open(
    dataStore: DataStore,
    library: LibraryCommunicator,
  ) {
    LearningObjectAdapter._instance = new LearningObjectAdapter(
      dataStore,
      library,
    );
  }
  static getInstance(): LearningObjectAdapter {
    if (this._instance) {
      return this._instance;
    }
    throw new Error('LearningObjectAdapter has not been created yet.');
  }

  /**
   * Performs update operation on Learning Object's date
   *
   * @param {string} id [Id of the Learning Object being updated]
   */
  async updateObjectLastModifiedDate(id: string): Promise<void> {
    return updateObjectLastModifiedDate({ dataStore: this.dataStore, id });
  }
  /**
   * Retrieves released file metadata by id
   *
   * @export
   * @param {string} id [Id of the Learning Object]
   * @param {string} fileId [Id of the file]
   * @returns {Promise<LearningObject.Material.File>}
   */
  async getReleasedFile({
    id,
    fileId,
  }: {
    id: string;
    fileId: string;
  }): Promise<LearningObject.Material.File> {
    return getReleasedFile({
      dataStore: this.dataStore,
      id,
      fileId,
    });
  }
  /**
   * Retrieves all released file metadata for a Learning Object
   *
   * @export
   * @param {string} id [Id of the Learning Object]
   * @returns {Promise<LearningObject.Material.File>}
   */
  async getReleasedFiles(id: string): Promise<LearningObject.Material.File[]> {
    return getReleasedFiles({
      dataStore: this.dataStore,
      id,
    });
  }
  /**
   * Retrieves a summary of the working copy Learning Object
   *
   * @param {UserToken} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @returns {Promise<LearningObjectSummary>}
   */
  async getWorkingLearningObjectSummary({
    requester,
    id,
  }: {
    requester: UserToken;
    id: string;
  }): Promise<LearningObjectSummary> {
    return getWorkingLearningObjectSummary({
      dataStore: this.dataStore,
      requester,
      id,
    });
  }
  /**
   * Retrieves a summary of the working copy Learning Object
   *
   * @param {string} id [Id of the Learning Object]
   * @returns {Promise<LearningObjectSummary>}
   */
  async getReleasedLearningObjectSummary(
    id: string,
  ): Promise<LearningObjectSummary> {
    return getReleasedLearningObjectSummary({
      dataStore: this.dataStore,
      id,
    });
  }

  /**
   * Retrieves the Learning Object copy that is furthest along in the review pipeline
   *
   * @param {UserToken} requester [Object containing information about the requester]
   * @param {string} id [Id of the Learning Object]
   * @returns {Promise<LearningObjectSummary>}
   */
  async getActiveLearningObjectSummary({
    requester,
    id,
  }: {
    requester: UserToken;
    id: string;
  }): Promise<LearningObjectSummary> {
    return getActiveLearningObjectSummary({
      dataStore: this.dataStore,
      requester,
      id,
    });
  }

  /**
   * Fetches a learning object by ID
   *
   * @export
   * @param {string} id the learning object's id
   * @returns {Promise<LearningObject>}
   */
  async getLearningObjectById(params: {
    id: string;
    requester?: UserToken;
    filter?: LearningObjectFilter;
  }): Promise<LearningObject> {
    return getLearningObjectById({
      dataStore: this.dataStore,
      library: this.library,
      ...params,
    });
  }

  /**
   * Updates Readme PDF for Learning Object
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     object?: LearningObject;
   *     id?: string;
   *   }} params
   * @returns {Promise<LearningObject>}
   * @memberof LearningObjectInteractor
   */
  async updateReadme(params: {
    object?: LearningObject;
    requester: UserToken;
    id?: string;
  }): Promise<void> {
    return updateReadme({
      dataStore: this.dataStore,
      object: params.object,
      id: params.id,
      requester: params.requester,
    });
  }

  /**
   * Update an existing learning object record.
   * NOTE: promise rejected if another learning object
   *       tied to the same author and with the same 'name' field
   *       already exists
   *
   * @async
   *
   * @param {LearningObjectID} id - database id of the record to change
   * @param {LearningObject} object - entity with values to update to
   */
  async updateLearningObject(params: {
    userToken: UserToken;
    id: string;
    authorUsername: string;
    updates: Partial<LearningObject>;
  }): Promise<void> {
    return updateLearningObject({
      requester: params.userToken,
      id: params.id,
      authorUsername: params.authorUsername,
      updates: params.updates,
      dataStore: this.dataStore,
    });
  }

  // FIXME: Remove once downloads use id instead of Learning Object name in the URL
  async getLearningObjectByName(params: {
    username: string,
    learningObjectName: string,
    userToken: UserToken,
    revision: boolean,
  }): Promise<LearningObject> {
    return getLearningObjectByName({
      dataStore: this.dataStore,
      library: this.library,
      username: params.username,
      learningObjectName: params.learningObjectName,
      userToken: params.userToken,
      revision: params.revision,
    });
  }
}
