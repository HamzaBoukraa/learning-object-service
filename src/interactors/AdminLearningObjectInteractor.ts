import { LearningObjectInteractor } from './interactors';
import { updateLearningObject } from '../LearningObjects/LearningObjectInteractor';
import { DataStore, FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { LearningObjectLock, LearningObject } from '@cyber4all/clark-entity/dist/learning-object';

export class AdminLearningObjectInteractor {
  private static learningObjectInteractor = LearningObjectInteractor;

  /**
   * Return literally all objects
   * @returns {LearningObject[]} array of all objects
   */
  public static async fetchAllObjects(
    dataStore: DataStore,
    currPage?: number,
    limit?: number,
  ): Promise<any> {
    try {
      const accessUnpublished = true;
      const response = await dataStore.fetchAllObjects(
        accessUnpublished,
        currPage,
        limit,
      );
      return response;
    } catch (e) {
      return Promise.reject(
        `Problem fetching all Learning Objects. Error: ${e}`,
      );
    }
  }
  /**
   * Search for objects by name, author, length, level, and content.
   *
   * @param {string} name the objects' names should closely relate
   * @param {string} author the objects' authors' names` should closely relate
   * @param {string} length the objects' lengths should match exactly
   * @param {string} level the objects' levels should match exactly TODO: implement
   * @param {boolean} ascending whether or not result should be in ascending order
   *
   * @returns {Outcome[]} list of outcome suggestions, ordered by score
   */
  public static async searchObjects(
    dataStore: DataStore,
    library: LibraryCommunicator,
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    orderBy?: string,
    sortType?: number,
    page?: number,
    limit?: number,
    collection?: string
  ): Promise<any> {
    try {
      const accessUnpublished = true;
      return await this.learningObjectInteractor.searchObjects(dataStore, library, {
          name,
          author,
          collection: collection,
          status: undefined,
          length,
          level,
          standardOutcomeIDs,
          text,
          accessUnpublished,
          orderBy,
          sortType,
          currPage: page,
          limit,
        },
      );
    } catch (e) {
      return Promise.reject(`Problem searching Learning Objects. Error:${e}`);
    }
  }

  public static async loadFullLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
    learningObjectID: string,
  ): Promise<any> {
    try {
      return await dataStore.fetchLearningObject(learningObjectID, true, true);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public static async togglePublished(
    dataStore: DataStore,
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    try {
      return await this.learningObjectInteractor.togglePublished(
        dataStore,
        username,
        id,
        published,
      );
    } catch (e) {
      return Promise.reject(`Problem toggling publish status. Error:  ${e}`);
    }
  }

  public static async toggleLock(
    dataStore: DataStore,
    id: string,
    lock?: LearningObjectLock,
  ): Promise<void> {
    try {
      return await dataStore.toggleLock(id, lock);
    } catch (e) {
      return Promise.reject(`Problem toggling lock. Error:  ${e}`);
    }
  }

  public static async deleteLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    username: string,
    learningObjectName: string,
  ): Promise<void> {
    try {
      return await this.learningObjectInteractor.deleteLearningObject(
        dataStore,
        fileManager,
        username,
        learningObjectName,
      );
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Object. Error: ${error}`,
      );
    }
  }

  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
    username: string,
    learningObjectIDs: string[],
  ): Promise<void> {
    try {
      return await this.learningObjectInteractor.deleteMultipleLearningObjects(
        dataStore,
        fileManager,
        library,
        username,
        learningObjectIDs,
      );
    } catch (error) {
      return Promise.reject(
        `Problem deleting Learning Objects. Error: ${error}`,
      );
    }
  }

  public static async updateLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    id: string,
    learningObject: LearningObject,
  ): Promise<void> {
    try {
      return await updateLearningObject(
        dataStore,
        fileManager,
        id,
        learningObject,
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
