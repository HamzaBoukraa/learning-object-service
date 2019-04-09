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
  id: string;
  collection: string;
}): Promise<void> {
  await validateSubmissionRequest({
    dataStore: params.dataStore,
    username: params.username,
  });
  const object = await params.dataStore.fetchLearningObject({
    id: params.id,
    full: true,
  });
  // tslint:disable-next-line:no-unused-expression
  new SubmittableLearningObject(object);
  await params.dataStore.submitLearningObjectToCollection(
    params.username,
    params.id,
    params.collection,
  );
  const submission: Submission = {
    collection: params.collection,
    timestamp: Date.now().toString(),
  };
  await params.dataStore.recordSubmission({
    submission,
  });
  await updateReadme({
    dataStore: params.dataStore,
    fileManager: params.fileManager,
    id: params.id,
  });
}

export async function cancelSubmission(
  dataStore: DataStore,
  id: string,
): Promise<void> {
  await dataStore.unsubmitLearningObject(id);
}

async function validateSubmissionRequest(params: {
  dataStore: DataStore,
  username: string,
}): Promise<void> {
  const user = await params.dataStore.fetchUser(params.username);
  if (!user.emailVerified) {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }
}

