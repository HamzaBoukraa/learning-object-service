import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { UserToken } from '../../shared/types/user-token';

export class StubLearningObjectSubmissionGateway implements LearningObjectSubmissionGateway {
    /**
     *
     * @inheritdoc
     */
    deleteSubmission(params: {
        learningObjectId: string;
        authorUsername: string;
        user: UserToken;
    }): Promise<void> {
       return Promise.resolve();
    }
}
