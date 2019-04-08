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
  await validateErrors({
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
    userId: params.userId,
    user: params.user,
  });
  await params.dataStore.createChangelog({
    learningObjectId: params.learningObjectId,
    userId: params.userId,
    changelogText: params.changelogText,
  });
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
  await validateErrors({
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
    userId: params.userId,
    user: params.user,
  });
  return await params.dataStore.fetchRecentChangelog({
    learningObjectId: params.learningObjectId,
  });
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
  user: UserToken,
}): Promise<ChangeLogDocument[]> {
  await validateErrors({
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
    userId: params.userId,
    user: params.user,
  });
  return await params.dataStore.fetchAllChangelogs({
    learningObjectId: params.learningObjectId,
  });
}

async function validateErrors(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  user: UserToken,
}): Promise<void> {
  if (!(await hasLearningObjectWriteAccess(params.user, params.dataStore, params.learningObjectId))) {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
  if (!(await params.dataStore.checkLearningObjectExistence({
    learningObjectId: params.learningObjectId,
    userId: params.userId,
  }))) {
    throw new ResourceError(
      `Learning Object ${params.learningObjectId} not found for user ${params.userId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  }
}
