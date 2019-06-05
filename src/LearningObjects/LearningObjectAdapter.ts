import { DataStore } from '../shared/interfaces/DataStore';
import { LearningObject } from '../shared/entity';
import { FileManager } from '../shared/interfaces/interfaces';
import { updateReadme, getLearningObjectById } from './LearningObjectInteractor';

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
}

