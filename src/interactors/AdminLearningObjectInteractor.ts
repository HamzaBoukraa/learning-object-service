import { LearningObjectInteractor } from './interactors';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../interfaces/interfaces';
import {
  deleteLearningObject,
} from '../LearningObjects/LearningObjectInteractor';
import { LearningObject } from '@cyber4all/clark-entity';
import { verifyAccessGroup } from './AuthGuard';
import { accessGroups } from '../types/user-token';


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
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR];
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
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
   *         *** Access Groups ***
   * *** Admin, Editor, Curator, Reviewer ***
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
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR, accessGroups.CURATOR, accessGroups.REVIEWER];
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      const accessUnpublished = true;
      return await this.learningObjectInteractor.searchObjects(
        dataStore,
        library,
        {
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

  /**
   * Obtain a full learning object (object includes all properties)
   * 
   *     *** Access Groups ***
   * *** Admin, Editor, Curator ***
   *
   * @param {DataStore} dataStore an instance of datastore
   * @param {string} learningObjectID the id of the target learning object
   * @param {string[]} userAccessGroups list of current user's access groups
   *
   * @returns {LearningObject} a full learning object
   */
  public static async loadFullLearningObject(
    dataStore: DataStore,
    learningObjectID: string,
    userAccessGroups: string[]
  ): Promise<LearningObject> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR, accessGroups.CURATOR];
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

  /**
   * *** Function to phase out ***
   */
  public static async toggleLock(
    dataStore: DataStore,
    userAccessGroups: string[],
    id: string,
    lock?: LearningObject.Lock,
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR];
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      return await dataStore.toggleLock(id, lock);
    } catch (e) {
      return Promise.reject(`Problem toggling lock. Error:  ${e}`);
    }
  }

  /**
   * Delete a specified learning object
   * 
   *     *** Access Groups ***
   * *** Admin, Editor, Curator ***
   *
   * @param {DataStore} dataStore an instance of datastore
   * @param {FileManager} fileManager an instance of filemanager
   * @param {string} username username of current user
   * @param {string} learningObjectName name of the learning object being deleted
   * @param {LibraryCommunicator} library an instance of library communicator
   * @param {string[]} userAccessGroups list of current user's access groups
   *
   * @returns {void} 
   */
  public static async deleteLearningObject(
    dataStore: DataStore,
    fileManager: FileManager,
    username: string,
    learningObjectName: string,
    library: LibraryCommunicator,
    userAccessGroups: string[]
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.EDITOR, accessGroups.CURATOR];
      verifyAccessGroup(userAccessGroups, requiredAccessGroups);
      return await deleteLearningObject(
        dataStore,
        fileManager,
        username,
        learningObjectName,
        library,
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

  /**
   * Delete multiple specified learning objects
   * 
   *  *** Access Groups ***
   * *** Admin, Curator ***
   *
   * @param {DataStore} dataStore an instance of datastore
   * @param {FileManager} fileManager an instance of filemanager
   * @param {LibraryCommunicator} library an instance of library communicator
   * @param {string} username username of current user
   * @param {string[]} learningObjectIDs list of learning object ids to be deleted
   * @param {string[]} userAccessGroups list of current user's access groups
   *
   * @returns {void} 
   */
  public static async deleteMultipleLearningObjects(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
    username: string,
    learningObjectIDs: string[],
    userAccessGroups: string[]
  ): Promise<void> {
    try {
      const requiredAccessGroups = [accessGroups.ADMIN, accessGroups.CURATOR];
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
}
