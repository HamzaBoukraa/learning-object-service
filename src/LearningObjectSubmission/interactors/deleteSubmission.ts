import { SubmissionPublisher } from './SubmissionPublisher';
import { UserToken } from '../../shared/types';
import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { LearningObject } from '../../shared/entity';

/**
 * deleteSubmission removes a submitted Learning Object from access by
 * reviewers, curators, editors, or admins.
 *
 * getLearningObjectSummary checks that the Learning Object
 * exists and that the requester has one of author, admin, or editor
 * privilege. The returned working copy Learning Object is
 * then used to validate that the provided request structure is valid
 * by checking the author id against the given userId.
 * If no errors are thrown, then the Learning Object submission
 * is deleted.
 *
 * @param {
 *    publisher: SubmissionPublisher,
 *    learningObjectId: string,
 *    userId: string,
 *    user: UserToken
 * }
 */
export async function deleteSubmission(params: {
  publisher: SubmissionPublisher;
  learningObjectId: string;
  authorUsername: string;
  user: UserToken;
}): Promise<void> {
  const LearningObjectGateway = LearningObjectAdapter.getInstance();
  const learningObject = await LearningObjectGateway.getLearningObjectSummary({
    id: params.learningObjectId,
    requester: params.user,
  });
  const isReleased = learningObject.status === LearningObject.Status.RELEASED;
  if (learningObject.author.username !== params.authorUsername) {
    throw new ResourceError(
      `User with username ${params.authorUsername} does not own Learning Object with id of ${params.learningObjectId}`,
      ResourceErrorReason.BAD_REQUEST,
    );
  }
  if (!isReleased)
    await params.publisher.deleteSubmission(params.learningObjectId);
}
