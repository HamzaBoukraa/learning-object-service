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
}): Promise<boolean> {
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
<<<<<<< HEAD

async function validateSubmissionRequest(params: {
  dataStore: DataStore,
  username: string,
  userId: string,
}): Promise<void> {
  const user = await params.dataStore.fetchUser(params.username);
  if (!user.emailVerified) {
    throw new ResourceError(
      'Invalid Access',
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  const object = await params.dataStore.checkLearningObjectExistence(
    params.learningObjectId,
    params.userId,
  )
}

=======
>>>>>>> e2a953eed3d000ca24eb58f20534ad289dee41c8
