import { SubmissionDataStore } from '../SubmissionDatastore';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';
import { SubmissionPublisher } from './SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { UserToken } from '../../shared/types';

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
  publisher: SubmissionPublisher;
  learningObjectId: string;
  userId: string;
  user: UserToken;
  emailVerified: boolean;
}): Promise<void> {
  const LearningObjectGateway = LearningObjectAdapter.getInstance();
  const object = await LearningObjectGateway.getWorkingLearningObjectSummary({
    id: params.learningObjectId,
    requester: params.user,
  });

  if (params.userId !== object.author.id) {
    throw new ResourceError(
      'Only the author may cancel a submission.',
      ResourceErrorReason.FORBIDDEN,
    );
  }

  if (object.status !== LearningObject.Status.WAITING) {
    throw new ResourceError(
      `Learning Object with id ${params.learningObjectId} is not in Waiting`,
      ResourceErrorReason.CONFLICT,
    );
  }

  const submission = await params.dataStore.fetchRecentSubmission(
    params.learningObjectId,
  );
  if (submission) {
    if (submission.cancelDate) {
      throw new ResourceError(
        'This submission has already been canceled',
        ResourceErrorReason.BAD_REQUEST,
      );
    }

    await params.dataStore.recordCancellation(params.learningObjectId);
  }

  await LearningObjectGateway.updateLearningObject({
    userToken: params.user,
    authorUsername: params.user.username,
    id: params.learningObjectId,
    updates: {
      status: LearningObject.Status.UNRELEASED,
    },
  });
  await params.publisher.deleteSubmission(params.learningObjectId);
}
