import { DataStore } from '../interfaces/DataStore';
import { reportError } from '../drivers/SentryConnector';
import { hasLearningObjectWriteAccess } from '../interactors/AuthorizationManager';
import { UserToken } from '../types';
import { LearningObjectError } from '../errors';
import { ChangeLogDocument } from '../types/Changelog';

/**
 * Instruct the datastore to create a new log in the changelogs collection
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 * @param {string} userId The id of the user that wrote the incoming changelog
 * @param {string} changelogText The contents of the incoming changelog
 *
 * @returns {void}
 */
export async function createChangelog(params: {
  dataStore: DataStore,
  learningObjectId: string,
  user: UserToken,
  changelogText: string,
}): Promise<void> {
  try {
    const hasAccess = hasLearningObjectWriteAccess(params.user, params.dataStore, params.learningObjectId);
    if (hasAccess) {
      const authorID = await params.dataStore.findUser(params.user.username);
      const objectId = await params.dataStore.checkLearningObjectExistence(params.learningObjectId);
      if (objectId && objectId.length > 0) {
        await params.dataStore.createChangelog(params.learningObjectId, authorID, params.changelogText);
      } else {
        return Promise.reject(new Error(LearningObjectError.RESOURCE_NOT_FOUND()));
      }
    } else {
      return Promise.reject(new Error(LearningObjectError.INVALID_ACCESS()));
    }
  } catch (e) {
    return Promise.reject(e instanceof Error ? e : new Error(e));
  }
}

/**
 * Instruct the datastore to fetch a changelog object with only the last element in the logs array
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 *
 * @returns {void}
 */
export async function getRecentChangelog(
    dataStore: DataStore,
    learningObjectId: string,
  ): Promise<ChangeLogDocument> {
    try {
      const changelog = await dataStore.fetchRecentChangelog(learningObjectId);
      return changelog;
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(LearningObjectError.RESOURCE_NOT_FOUND()));
    }
  }
