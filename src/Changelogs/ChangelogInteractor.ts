import { DataStore } from '../interfaces/DataStore';
import { hasLearningObjectWriteAccess } from '../interactors/AuthorizationManager';
import { UserToken } from '../types';
import { ResourceError, ResourceErrorReason } from '../errors';
import { ChangeLogDocument } from '../types/Changelog';

/**
 * Instruct the data store to create a new log in the change logs collection
 *
 * @param {DataStore} params.dataStore An instance of DataStore
 * @param {string} params.learningObjectId The id of the learning object that the requested changelog belongs to
 * @param {string} params.userId The id of the user that wrote the incoming changelog
 * @param {string} params.changelogText The contents of the incoming changelog
 *
 * @returns {void}
 */
export async function createChangelog(params: {
  dataStore: DataStore,
  learningObjectId: string,
  user: UserToken,
  changelogText: string,
}): Promise<void> {
  const hasAccess = hasLearningObjectWriteAccess(params.user, params.dataStore, params.learningObjectId);
  if (hasAccess) {
    const authorID = await params.dataStore.findUser(params.user.username);
    const objectId = await params.dataStore.checkLearningObjectExistence(params.learningObjectId);
    if (objectId && objectId.length > 0) {
      await params.dataStore.createChangelog(params.learningObjectId, authorID, params.changelogText);
    } else {
      return Promise.reject(new ResourceError('Learning Object not found.', ResourceErrorReason.NOT_FOUND));
    }
  } else {
    return Promise.reject(new ResourceError('Invalid Access', ResourceErrorReason.INVALID_ACCESS));
  }
}

/**
 * Fetches the most recent change log from the data store.
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
  return await dataStore.fetchRecentChangelog(learningObjectId);
}
