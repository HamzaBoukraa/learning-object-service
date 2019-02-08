import { DataStore } from '../interfaces/DataStore';
import { SubmittableLearningObject } from '@cyber4all/clark-entity';
import { updateReadme } from '../LearningObjects/LearningObjectInteractor';
import { FileManager } from '../interfaces/interfaces';
import { reportError } from '../drivers/SentryConnector';
import { hasLearningObjectWriteAccess } from '../interactors/AuthorizationManager';
import { UserToken } from '../types';
import { ResourceError, ResourceErrorReason } from '../errors';

export async function submitForReview(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  username: string;
  id: string;
  collection: string;
}): Promise<void> {
  try {
    const object = await params.dataStore.fetchLearningObject(
      params.id,
      true,
      true,
    );
    const _ = new SubmittableLearningObject(object);
    await params.dataStore.submitLearningObjectToCollection(
      params.username,
      params.id,
      params.collection,
    );
    await updateReadme({
      dataStore: params.dataStore,
      fileManager: params.fileManager,
      id: params.id,
    });
  } catch (e) {
    console.log(e);
    // TODO: Convey that this is an internal server error
    return Promise.reject(
      e instanceof Error ? e : new Error(`Problem submitting learning object.`),
    );
  }
}
export async function cancelSubmission(
  dataStore: DataStore,
  id: string,
): Promise<void> {
  await dataStore.unsubmitLearningObject(id);
}

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
        return Promise.reject(new ResourceError('Learning Object not found.', ResourceErrorReason.NOT_FOUND));
      }
    } else {
      return Promise.reject(new ResourceError('Invalid Access', ResourceErrorReason.INVALID_ACCESS));
    }
  } catch (e) {
    reportError(e);
    return Promise.reject(e instanceof Error ? e : new Error(e));
  }
}
