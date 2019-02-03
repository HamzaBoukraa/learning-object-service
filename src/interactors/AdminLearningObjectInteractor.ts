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
 
}
