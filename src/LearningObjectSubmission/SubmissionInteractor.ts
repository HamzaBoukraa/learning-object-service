import { DataStore } from '../shared/interfaces/DataStore';
import { updateReadme } from '../LearningObjects/LearningObjectInteractor';
import { FileManager } from '../shared/interfaces/interfaces';
import { SubmittableLearningObject } from '../shared/entity';
import { Submission } from './types/Submission';
import { UserToken } from '../shared/types';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { SubmissionDataStore } from './SubmissionDataStore';
import { LearningObjectAdapter } from '../LearningObjects/LearningObjectAdapter';
import { EntityError } from '../shared/entity/errors/entity-error';

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
  dataStore: SubmissionDataStore;
  fileManager: FileManager;
  user: UserToken;
  learningObjectId: string;
  userId: string;
  collection: string;
}): Promise<void> {
  if (!params.user.emailVerified) {
    throw new ResourceError(
      'Please verify your email address to submit a Learning Object',
      ResourceErrorReason.FORBIDDEN,
    );
  }
  const object = await LearningObjectAdapter.getInstance().getLearningObjectById(params.learningObjectId);

  try {
    // tslint:disable-next-line:no-unused-expression
    new SubmittableLearningObject(object);
  } catch (error) {
    if (error instanceof EntityError) {
      throw new ResourceError(error.message, ResourceErrorReason.BAD_REQUEST);
    } else throw error;
  }
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

  await LearningObjectAdapter.getInstance().updateReadme({
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
  dataStore: SubmissionDataStore,
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
  dataStore: SubmissionDataStore,
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

