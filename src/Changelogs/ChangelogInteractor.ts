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
  userId: string,
  changelogText: string,
}): Promise<void> {
  const hasAccess = hasLearningObjectWriteAccess(params.user, params.dataStore, params.learningObjectId);
  if (hasAccess) {
    const objectId = await params.dataStore.checkLearningObjectExistence(
      params.learningObjectId,
      params.userId,
    );
    if (objectId) {
      await params.dataStore.createChangelog(
        params.learningObjectId,
        params.userId,
        params.changelogText,
      );
    } else {
      throw new ResourceError(
        `Learning Object ${params.learningObjectId} not found ${params.userId}.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
  } else {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}

/**
 * Fetches the most recent change log from the data store.
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 *
 * @returns {ChangeLogDocument}
 */
export async function getRecentChangelog(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  user: UserToken,
}): Promise<ChangeLogDocument> {
  if (hasLearningObjectWriteAccess(params.user, params.dataStore, params.learningObjectId)) {
    const changelog = await params.dataStore.fetchRecentChangelog(
      params.userId,
      params.learningObjectId
    );
    if (changelog) {
      return changelog;
    }
    throw new ResourceError(
      `Learning Object ${params.learningObjectId} not found for user ${params.userId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  } else {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}

/**
 * Fetches all change logs for a specific learning object from the data store .
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 *
 * @returns {ChangeLogDocument[]}
 */
export async function getAllChangelogs(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
}): Promise<ChangeLogDocument[]> {
  if (hasLearningObjectWriteAccess(params.user, params.dataStore, params.learningObjectId)) {
    const changelogs = await params.dataStore.fetchAllChangelogs(
      params.learningObjectId,
      params.userId,
    );
    if (changelogs) {
      return changelogs;
    }
    throw new ResourceError(
      `Learning Object ${params.learningObjectId} not found for user ${params.userId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  } else {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

}
