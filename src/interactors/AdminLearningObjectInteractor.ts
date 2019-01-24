import { LearningObjectInteractor } from './interactors';
import { updateLearningObject, deleteLearningObject } from '../LearningObjects/LearningObjectInteractor';
import { DataStore, FileManager, LibraryCommunicator } from '../interfaces/interfaces';
import { LearningObjectLock, LearningObject,  } from '@cyber4all/clark-entity/dist/learning-object';
import { verifyAccessGroup, accessGroups } from './authGuard';

export class AdminLearningObjectInteractor {
  private static learningObjectInteractor = LearningObjectInteractor;

  /**
   * Return literally all objects
   * @returns {LearningObject[]} array of all objects
   */
  public static async fetchAllObjects(
    dataStore: DataStore,
    userAccessGroups: string[],
    currPage?: number,
    limit?: number,
  ): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups)
      const accessUnpublished = true;
      const response = await dataStore.fetchAllObjects(
        accessUnpublished,
        currPage,
        limit,
      );
      return response;
    } catch (e) {
      if (e instanceof Error) {
        return Promise.reject(e.message);
      } else {
        return Promise.reject(
          `Problem fetching all Learning Objects. ${e}`,
        );
      }
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
    userAccessGroups: string[],
    orderBy?: string,
    sortType?: number,
    page?: number,
    limit?: number,
  ): Promise<{ total: number; objects: LearningObject[] }> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR, accessGroups.CURATOR, accessGroups.REVIEWER]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      const accessUnpublished = true;
      return await this.learningObjectInteractor.searchObjects(dataStore, library, {
          name,
          author,
          collection: undefined,
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
      if (e instanceof Error) {
        return Promise.reject(e.message);
      } else {
        return Promise.reject(`Problem searching Learning Objects. Error:${e}`);
      }
    }
  }

  public static async loadFullLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
    learningObjectID: string,
    userAccessGroups: string[]
  ): Promise<LearningObject> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR, accessGroups.CURATOR]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      return await dataStore.fetchLearningObject(learningObjectID, true, true);
    } catch (e) {
      if (e instanceof Error) {
        return Promise.reject(e.message);
      } else {
        return Promise.reject(e);
      }
    }
  }

  public static async togglePublished(
    dataStore: DataStore,
    username: string,
    id: string,
    published: boolean,
    userAccessGroups: string[]
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      return await dataStore.togglePublished(
        username,
        id,
        published,
      );
    } catch (e) {
      if (e instanceof Error) {
        return Promise.reject(e.message);
      } else {
        return Promise.reject(`Problem toggling publish status. Error:  ${e}`);
      }
    }
  }

  public static async toggleLock(
    dataStore: DataStore,
    id: string,
    userAccessGroups: string[],
    lock?: LearningObjectLock,
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
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
    library: LibraryCommunicator,
    userAccessGroups: string[]
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR, accessGroups.CURATOR]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      return await deleteLearningObject(
        dataStore,
        fileManager,
        username,
        learningObjectName,
        library
      );
    } catch (e) {
      if (e instanceof Error) {
        return Promise.reject(e.message);
      } else {
        return Promise.reject(
          `Problem deleting Learning Object. Error: ${e}`,
        );
      }
    }
  }

  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
    username: string,
    learningObjectIDs: string[],
    userAccessGroups: string[]
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.CURATOR]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      return await this.learningObjectInteractor.deleteMultipleLearningObjects(
        dataStore,
        fileManager,
        library,
        username,
        learningObjectIDs,
      );
    } catch (e) {
      if (e instanceof Error) {
        return Promise.reject(e.message);
      } else {
        return Promise.reject(
          `Problem deleting Learning Objects. Error: ${e}`,
        );
      }
    }
  }

  public static async updateLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    id: string,
    learningObject: LearningObject,
    userAccessGroups: string[]
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR, accessGroups.CURATOR]
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      return await updateLearningObject(
        dataStore,
        fileManager,
        id,
        learningObject,
      );
    } catch (e) {
      if (e instanceof Error) {
        return Promise.reject(e.message);
      } else {
        return Promise.reject(`Error updating learning object:  ${e}`);
      }
    }
  }
}
