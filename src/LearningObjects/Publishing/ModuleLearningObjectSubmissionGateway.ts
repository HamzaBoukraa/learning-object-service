import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { LearningObjectSubmissionAdapter } from '../../LearningObjectSubmission/adapters/LearningObjectSubmissionAdapter';
import { UserToken, LearningObjectMetadataUpdates } from '../../shared/types';

export class ModuleLearningObjectSubmissionGateway
  implements LearningObjectSubmissionGateway {
  /**
   *
   * @inheritdoc
   */
  deleteSubmission(params: {
    learningObjectId: string;
    authorUsername: string;
    user: UserToken;
  }): Promise<void> {
    return LearningObjectSubmissionAdapter.getInstance().deleteSubmission(
      params,
    );
  }

  /**
   * @inheritdoc
   */
  updateSubmission({
    learningObjectId,
    updates,
    user,
  }: {
    learningObjectId: string;
    updates: LearningObjectMetadataUpdates;
    user: UserToken;
  }): Promise<void> {
    return LearningObjectSubmissionAdapter.getInstance().applySubmissionUpdates(
      {
        learningObjectId,
        updates,
        user,
      },
    );
  }
}
