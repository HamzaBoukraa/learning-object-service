import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { LearningObjectSubmissionAdapter } from '../../LearningObjectSubmission/adapters/LearningObjectSubmissionAdapter';
import { UserToken, LearningObjectMetadataUpdates } from '../../shared/types';
import { LearningObject } from '../../shared/entity';

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
    return LearningObjectSubmissionAdapter.getInstance().deleteLearningObjectSubmission(
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
    return LearningObjectSubmissionAdapter.getInstance().updateLearningObjectSubmission(
      {
        learningObjectId,
        updates,
        user,
      },
    );
  }
}
