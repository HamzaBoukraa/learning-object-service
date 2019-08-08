import { SubmissionPublisher } from './SubmissionPublisher';
import { UserToken, LearningObjectMetadataUpdates } from '../../shared/types';
import { requesterIsAdminOrEditor } from '../../shared/AuthorizationManager';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';

/**
 * applySubmissionUpdates allows admins and editors to publish changes to a submission for other
 * reviewers to see, as a Learning Object is moving through the submission pipeline.
 */
export async function applySubmissionUpdates(params: {
  publisher: SubmissionPublisher;
  learningObjectId: string;
  user: UserToken;
  updates: LearningObjectMetadataUpdates;
}): Promise<void> {
  const { publisher, learningObjectId, user, updates } = params;
  const isAdminOrEditor = requesterIsAdminOrEditor(user);

  if (!isAdminOrEditor) {
    throw new ResourceError(
      `You do not have write access to ${user.name}'s material`,
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  await publisher.updateSubmission({
    learningObjectId,
    updates,
  });
}
