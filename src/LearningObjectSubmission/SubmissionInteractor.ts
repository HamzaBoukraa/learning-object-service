import { DataStore } from '../interfaces/DataStore';
import { updateReadme } from '../LearningObjects/LearningObjectInteractor';
import { FileManager } from '../interfaces/interfaces';
import { SubmittableLearningObject } from '../entity';
import { Submission } from './types/Submission';
import { authorizeSubmissionRequest } from './AuthorizationManager';
import { UserToken } from '../types';
import { ResourceError, ResourceErrorReason } from '../errors';

/**
 * Submit a learning object to a collection
 *
 * @param dataStore instance of dataStore
 * @param userId id of learning object author
 * @param learningObjectId id of the learning object to search for
 * @param fileManager instance of FileManager
 * @param user metadata about current user (instance of UserToken)
 * @param collection name of collection to submit learning object to
 */
export async function submitForReview(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  user: UserToken;
  learningObjectId: string;
  userId: string;
  collection: string;
}): Promise<void> {
  await authorizeSubmissionRequest({
    dataStore: params.dataStore,
    userId: params.userId,
    learningObjectId: params.learningObjectId,
    emailVerified: params.user.emailVerified,
  });
  const object = await params.dataStore.fetchLearningObject({
    id: params.learningObjectId,
    full: true,
  });
  // tslint:disable-next-line:no-unused-expression
  new SubmittableLearningObject(object);
  await params.dataStore.submitLearningObjectToCollection(
    params.user.username,
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

/**
 * Check if learning object is being submitted to a collection
 * for the first time.
 *
 * @param dataStore instance of dataStore
 * @param emailVerified boolean to check if current user has a verified email
 * @param userId id of learning object author
 * @param learningObjectId id of the learning object to search for
 * @param collection name of collection to search for in submission collection
 */
export async function checkFirstSubmission(params: {
  dataStore: DataStore,
  collection: string,
  learningObjectId: string,
  userId: string,
  emailVerified: boolean,
}): Promise<boolean> {
  await authorizeSubmissionRequest({
    dataStore: params.dataStore,
    userId: params.userId,
    learningObjectId: params.learningObjectId,
    emailVerified: params.emailVerified,
  });

  return await params.dataStore.fetchSubmission(
    params.collection,
    params.learningObjectId,
  )
  ? false
  : true;
}

/**
 * Cancels a learning object submission
 * Throws an error if requested submission has already been canceled
 *
 * @param dataStore instance of dataStore
 * @param emailVerified boolean to check if current user has a verified email
 * @param userId id of learning object author
 * @param learningObjectId id of the learning object to search for
 */
export async function cancelSubmission(params: {
  dataStore: DataStore,
  learningObjectId: string,
  userId: string,
  emailVerified: boolean,
}): Promise<void> {
  await authorizeSubmissionRequest({
    dataStore: params.dataStore,
    userId: params.userId,
    learningObjectId: params.learningObjectId,
    emailVerified: params.emailVerified,
  });
  const submission = await params.dataStore.fetchRecentSubmission(params.learningObjectId);
  if (submission && submission.cancelDate) {
    throw new ResourceError(
      'This submission has already been canceled',
      ResourceErrorReason.BAD_REQUEST,
    );
  }
  await params.dataStore.recordCancellation(params.learningObjectId);
  await params.dataStore.unsubmitLearningObject(params.learningObjectId);
}

