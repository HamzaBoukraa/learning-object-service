import { DataStore } from '../shared/interfaces/DataStore';
import { UserToken } from '../shared/types';
import { ResourceError, ResourceErrorReason } from '../errors';
import { ChangeLogDocument } from '../shared/types/Changelog';
import { hasChangelogAccess } from './AuthManager';
import * as md5 from 'md5';

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
  const role = await authorizeRequest({
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
    userId: params.userId,
    user: params.user,
  });
  const author = {
    userId: await params.dataStore.findUser(params.user.username),
    name: params.user.name,
    role,
    profileImage: generateProfileImageUrl({
      email: params.user.email,
    }),
  };
  await params.dataStore.createChangelog({
    learningObjectId: params.learningObjectId,
    author,
    changelogText: params.changelogText,
  });
}

/**
 * Fetches the most recent change log from the data store.
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 * @param {string} userId The id of learning object author
 * @param {UserToken} user information about the requester
 *
 * @returns {ChangeLogDocument}
 */
export async function getRecentChangelog(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  user: UserToken,
}): Promise<ChangeLogDocument> {
  await authorizeRequest({
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
 * @param {string} userId The id of learning object author
 * @param {UserToken} user information about the requester
 *
 * @returns {ChangeLogDocument[]}
 */
export async function getAllChangelogs(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  user: UserToken,
}): Promise<ChangeLogDocument[]> {
  await authorizeRequest({
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
    userId: params.userId,
    user: params.user,
  });
  return await params.dataStore.fetchAllChangelogs({
    learningObjectId: params.learningObjectId,
  });
}

/**
 * Determines if the request is valid
 * Ensure that the user making the reuqest has access to modify changelogs
 * Checks if the requested learning object exists
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 * @param {string} userId The id of learning object author
 * @param {UserToken} user information about the requester
 *
 * @returns {ChangeLogDocument[]}
 */
async function authorizeRequest(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  user: UserToken,
}): Promise<string> {
  const role = await hasChangelogAccess({
    user: params.user,
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
  });

  const isOwnedByAuthor = await params.dataStore.checkLearningObjectExistence({
    learningObjectId: params.learningObjectId,
    userId: params.userId,
  });

  if (!isOwnedByAuthor) {
    throw new ResourceError(
      `Learning Object ${params.learningObjectId} not found for user ${params.userId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  return role;
}

/**
 * Creates a gravatar profile profile image url from the user's email.
 *
 * @param {string} email user's email
 *
 * @returns {string}
 */
function generateProfileImageUrl(params: {
  email: string,
}): string {
  const defaultIcon = 'identicon';
  return (
    'https://www.gravatar.com/avatar/' +
    md5(params.email) +
    '?s=200?r=pg&d=' +
    defaultIcon
  );
}
