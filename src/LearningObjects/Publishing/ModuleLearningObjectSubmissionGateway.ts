import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { LearningObjectSubmissionAdapter } from '../../LearningObjectSubmission/adapters/LearningObjectSubmissionAdapter';
import { UserToken } from '../../shared/types';

export class ModuleLearningObjectSubmissionGateway implements LearningObjectSubmissionGateway {

    /**
     *
     * @inheritdoc
     */
    deleteSubmission(params: {
        learningObjectId: string;
        authorUsername: string;
        user: UserToken;
    }): Promise<void> {
       return LearningObjectSubmissionAdapter.getInstance().deleteLearningObjectSubmission(params);
    }
}
