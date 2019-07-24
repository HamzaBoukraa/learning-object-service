import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { UserToken } from '../../shared/types/user-token';
import { LearningObject } from '../../shared/entity';

export class StubLearningObjectSubmissionGateway implements LearningObjectSubmissionGateway {
    /** @inheritdoc */
    deleteSubmission(params: {
        learningObjectId: string;
        authorUsername: string;
        user: UserToken;
    }): Promise<void> {
       return Promise.resolve();
    }
    /** @inheritdoc */
    updateSubmission(params: { learningObjectId: string; updates: Partial<LearningObject>; user: UserToken; }): Promise<void> {
        return Promise.resolve();
    }
}
