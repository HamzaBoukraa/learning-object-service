import { SubmissionPublisher } from './SubmissionPublisher';
import { UserToken } from '../../shared/types';
import { requesterIsAdminOrEditor } from '../../shared/AuthorizationManager';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { LearningObject } from '../../shared/entity';

/**
 * updateSubmission allows admins and editors to publish changes to a submission for other
 * reviewers to see, as a Learning Object is moving through the submission pipeline.
 */
export async function updateSubmission(params: {
  publisher: SubmissionPublisher;
  learningObjectId: string;
  user: UserToken;
  updates: Partial<LearningObject>;
}): Promise<void> {
  const { publisher, learningObjectId, user, updates } = params;
  const isAdminOrEditor = requesterIsAdminOrEditor(user);

  if (!isAdminOrEditor) {
    throw new ResourceError(
      `You do not have write access to this ${user.name}'s material`,
      ResourceErrorReason.INVALID_ACCESS,
    );
  }

  publisher.updateSubmission({
    learningObjectId,
    updates,
  });
}
