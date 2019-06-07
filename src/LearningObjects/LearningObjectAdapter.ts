import { DataStore } from '../shared/interfaces/DataStore';
import { LearningObject } from '../shared/entity';
import { FileManager } from '../shared/interfaces/interfaces';
import { updateReadme, getLearningObjectById, updateLearningObject } from './LearningObjectInteractor';
import { UserToken } from '../shared/types';

/**
 * FIXME: THe duplication of JSDoc comments here is not ideal, as it means a change
 * must take place in two places.
 */
export class LearningObjectAdapter {
  private static _instance: LearningObjectAdapter;
  private constructor(private dataStore: DataStore, private fileManager: FileManager) { }
  static open(dataStore: DataStore, fileManager: FileManager) {
    LearningObjectAdapter._instance = new LearningObjectAdapter(dataStore, fileManager);
  }
  static getInstance(): LearningObjectAdapter {
    if (this._instance) {
      return this._instance;
    }
    throw new Error('LearningObjectAdapter has not been created yet.');
  }
  /**
   * Fetches a learning object by ID
   *
   * @export
   * @param {string} id the learning object's id
   * @returns {Promise<LearningObject>}
   */
  async getLearningObjectById(id: string): Promise<LearningObject> {
    return getLearningObjectById(this.dataStore, id);
  }

  /**
   * Updates Readme PDF for Learning Object
   *
   * @static
   * @param {{
   *     dataStore: DataStore;
   *     fileManager: FileManager;
   *     object?: LearningObject;
   *     id?: string;
   *   }} params
   * @returns {Promise<LearningObject>}
   * @memberof LearningObjectInteractor
   */
  async updateReadme(params: {
    object?: LearningObject;
    id?: string;
  }): Promise<void> {
    return updateReadme({
      dataStore: this.dataStore,
      fileManager: this.fileManager,
      object: params.object,
      id: params.id,
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
    updates: { [index: string]: any };
  }): Promise<void> {
    return updateLearningObject({
      userToken: params.userToken,
      id: params.id,
      updates: params.updates,
      dataStore: this.dataStore,
    });
  }
}

