import { DataStore } from '../interfaces/DataStore';
import { updateReadme } from '../LearningObjects/LearningObjectInteractor';
import { FileManager } from '../interfaces/interfaces';
import { SubmittableLearningObject } from '../entity';
import { Submission } from './types/Submission';
import { authorizeSubmissionRequest } from './AuthorizationManager';

export async function submitForReview(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  username: string;
  learningObjectId: string;
  userId: string;
  collection: string;
}): Promise<void> {
  await authorizeSubmissionRequest({
    dataStore: params.dataStore,
    userId: params.userId,
    learningObjectId: params.learningObjectId,
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
    learningObjectId: params.learningObjectId,
    collection: params.collection,
    timestamp: Date.now().toString(),
  };
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

export async function cancelSubmission(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  username: string,
}): Promise<void> {
  await authorizeSubmissionRequest({
    dataStore: params.dataStore,
    userId: params.userId,
    learningObjectId: params.learningObjectId,
    username: params.username,
  });
  await params.dataStore.unsubmitLearningObject(params.learningObjectId);
}

