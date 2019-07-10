import { DataStore } from '../shared/interfaces/DataStore';
import { UserToken } from '../shared/types';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { ChangeLogDocument } from '../shared/types/changelog';
import { hasChangelogAccess } from './AuthManager';
import * as md5 from 'md5';
import { LearningObject } from '../shared/entity';

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
  const role = await authorizeWriteRequest({
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
  await validateReadRequest({
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
    userId: params.userId,
  });
  return await params.dataStore.fetchRecentChangelog({
    learningObjectId: params.learningObjectId,
  });
}

/**
 * Handles whether all the change logs or if the change logs
 * created before a given date are fetched for a specified learning object.
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 * @param {string} userId The id of learning object author
 * @param {UserToken} user information about the requester
 * @param {string} date The date the changelog was created
 *
 * @returns {ChangeLogDocument[]}
 */
export async function getChangelogs(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  user: UserToken,
  date?: string,
  minusRevision?: boolean,
}): Promise<ChangeLogDocument[]> {
  const learningObject = await validateReadRequest({
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
    userId: params.userId,
  });

  // The Learning Object does not have any revisions
  if (learningObject.revision === 0) {
    // The Learning Object does not have any revisions and is
    // released. Return all change logs for this Learning Object
    // for all logged in users.
    if (learningObject.status === LearningObject.Status.RELEASED) {
      return await params.dataStore.fetchAllChangelogs({
        learningObjectId: params.learningObjectId,
      });
    // The Learning Object does not have any revisions and is
    // not released. Return all change logs for this Learning Object
    // for admins, editors, and Learning Object author.
    } else {
      await hasChangelogAccess({
        user: params.user,
        dataStore: params.dataStore,
        learningObjectId: params.learningObjectId,
      });
      return await params.dataStore.fetchAllChangelogs({
        learningObjectId: params.learningObjectId,
      });
    }
  // The Learning Object does have revisions
  } else {
    // The Learning Object does have revisions and the requester asked
    // for all change logs that are relevant to the released copy.
    if (params.minusRevision) {
      // LearningObjectGateway.getReleasedLearningObjectSummary()
      // return await params.dataStore.fetchChangelogsBeforeDate({ learningObjectId: params.learningObjectId, date: params.date });
    // The Learning Object does have revisions and the requester asked
    // for all change logs for the Learning Object
    // (including those relevant to revisions)
    } else {
      await hasChangelogAccess({
        user: params.user,
        dataStore: params.dataStore,
        learningObjectId: params.learningObjectId,
      });
      return await params.dataStore.fetchAllChangelogs({
        learningObjectId: params.learningObjectId,
      });
    }
  }

  if (params.date) {
    return await params.dataStore.fetchChangelogsBeforeDate({ learningObjectId: params.learningObjectId, date: params.date });
  } else {
    return await params.dataStore.fetchAllChangelogs({ learningObjectId: params.learningObjectId });
  }
}

/**
 * - Determines if the request to read change logs is valid
 * This request validation is performed by checking that the given
 * - Ensure that the user making the reuqest has write access to change logs.
 * Only the Learning Object author, editors, and admins have write access to
 * change logs.
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 * @param {string} userId The id of learning object author
 * @param {UserToken} user information about the requester
 *
 * @returns {ChangeLogDocument[]}
 */
async function authorizeWriteRequest(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  user: UserToken,
}): Promise<string> {
  const learningObject = await params.dataStore.checkLearningObjectExistence({
    learningObjectId: params.learningObjectId,
    userId: params.userId,
  });

  if (!learningObject) {
    throw new ResourceError(
      `Learning Object ${params.learningObjectId} not found for user ${params.userId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  const role = await hasChangelogAccess({
    user: params.user,
    dataStore: params.dataStore,
    learningObjectId: params.learningObjectId,
  });


  return role;
}

/**
 * - Determines if the request to read change logs is valid
 * This request validation is performed by checking that the given
 * authorId and learningObjectId pair exist.
 *
 * @param {DataStore} dataStore An instance of DataStore
 * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
 * @param {string} userId The id of learning object author
 * @param {UserToken} user information about the requester
 *
 * @returns {ChangeLogDocument[]}
 */
async function validateReadRequest(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
}): Promise<LearningObject> {
  const learningObject = await params.dataStore.checkLearningObjectExistence({
    learningObjectId: params.learningObjectId,
    userId: params.userId,
  });

  if (!learningObject) {
    throw new ResourceError(
      `Learning Object ${params.learningObjectId} not found for user ${params.userId}`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  return learningObject;
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
