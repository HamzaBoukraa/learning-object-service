import {
  DataStore,
} from '../interfaces/interfaces';
import { LearningObject } from '@cyber4all/clark-entity';
import { UserToken } from '../types/user-token';
import { hasLearningObjectWriteAccess } from './AuthorizationManager';


export class AdminLearningObjectInteractor {

  /**
   * *** Function to phase out ***
   */
  public static async toggleLock(
    dataStore: DataStore,
    user: UserToken,
    id: string,
    lock?: LearningObject.Lock,
  ): Promise<void> {
    try {
      const hasAccess = await hasLearningObjectWriteAccess(user, dataStore, id);
      if (hasAccess) {
        return await dataStore.toggleLock(id, lock);
      } else {
        return Promise.reject('User does not have permission to update this object');
      }
    } catch (e) {
      return Promise.reject(`Problem toggling lock. Error:  ${e}`);
    }
  }
}
