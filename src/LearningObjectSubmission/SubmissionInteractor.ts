import { DataStore } from '../interfaces/DataStore';
import { updateReadme } from '../LearningObjects/LearningObjectInteractor';
import { FileManager } from '../interfaces/interfaces';
import { reportError } from '../drivers/SentryConnector';
import { hasLearningObjectWriteAccess } from '../interactors/AuthorizationManager';
import { UserToken } from '../types';
import { ResourceError, ResourceErrorReason } from '../errors';
import { SubmittableLearningObject } from '../entity';
import { Submission } from './types/Submission';

export async function submitForReview(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  username: string;
  learningObjectId: string;
  userId: string;
  collection: string;
}): Promise<void> {
  await validateSubmissionRequest({
    dataStore: params.dataStore,
    username: params.username,
  });
  const object = await params.dataStore.fetchLearningObject({
    id: params.learningObjectId,
    full: true,
  });
  // tslint:disable-next-line:no-unused-expression
  new SubmittableLearningObject(object);
  await params.dataStore.submitLearningObjectToCollection(
    params.username,
    params.learningObjectId,
    params.collection,
  );
  const submission: Submission = {
    collection: params.collection,
    timestamp: Date.now().toString(),
  };
  const firstSubmission = await params.dataStore.
  await params.dataStore.recordSubmission(submission);
  await updateReadme({
    dataStore: params.dataStore,
    fileManager: params.fileManager,
    id: params.learningObjectId,
  });
}

export async function checkFirstSubmission(params: {
  dataStore: DataStore,
  collection: string,
  learningObjectId: string,
  userId: string,
  username: string,
}): Promise<boolean> {
  await authorizeSubmissionRequest({
    dataStore: params.dataStore,
    userId: params.userId,
    learningObjectId: params.learningObjectId,
    username: params.username,
  });
  return await params.dataStore.fetchSubmission(
    params.collection,
    params.learningObjectId,
  )
  ? true
  : false;
}

export async function cancelSubmission(
  dataStore: DataStore,
  id: string,
): Promise<void> {
  await dataStore.unsubmitLearningObject(id);
}

async function authorizeSubmissionRequest(params: {
  dataStore: DataStore,
  username: string,
  userId: string,
  learningObjectId: string,
}): Promise<void> {
  const user = await params.dataStore.fetchUser(params.username);
  if (!user.emailVerified) {
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

