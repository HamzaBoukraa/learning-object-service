import { SubmissionPublisher } from './SubmissionPublisher';
import { UserToken } from '../../shared/types';
import { LearningObjectAdapter } from '../../LearningObjects/adapters/LearningObjectAdapter';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';

/**
 * deleteSubmission removes a submitted Learning Object from access by
 * reviewers, curators, editors, or admins.
 *
 * getWorkingLearningObjectSummary checks that the Learning Object
 * exsits and that the requester has one of author, admin, or editor
 * privilege. The returned working copy Learning Object is
 * then used to validate that the provided request structure os valid
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
    const learningObject = await LearningObjectGateway.getWorkingLearningObjectSummary({
        id: params.learningObjectId,
        requester: params.user,
      });
    if (learningObject.author.username !== params.authorUsername) {
        throw new ResourceError(
            `User with username ${params.authorUsername} does not own Learning Object with id of ${params.learningObjectId}`,
            ResourceErrorReason.BAD_REQUEST,
        );
    }
    await params.publisher.deleteSubmission(params.learningObjectId);
}
