import { SubmissionDataStore } from '../SubmissionDatastore';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { LearningObjectAdapter } from '../../LearningObjects/LearningObjectAdapter';

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
  dataStore: SubmissionDataStore;
  learningObjectId: string;
  userId: string;
  emailVerified: boolean;
}): Promise<void> {
  const submission = await params.dataStore.fetchRecentSubmission(params.learningObjectId);
  if (submission && submission.cancelDate) {
    throw new ResourceError('This submission has already been canceled', ResourceErrorReason.BAD_REQUEST);
  }
  const object = await LearningObjectAdapter.getInstance().getLearningObjectById(params.learningObjectId);
  if (params.userId !== object.author.id) {
    throw new ResourceError('Only the author may cancel a submission.', ResourceErrorReason.FORBIDDEN);
  }
  await params.dataStore.recordCancellation(params.learningObjectId);
  await params.dataStore.unsubmitLearningObject(params.learningObjectId);
}
