import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { UserToken } from '../../shared/types/user-token';
import { LearningObjectMetadataUpdates } from '../../shared/types';

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
    updateSubmission(params: {
        learningObjectId: string;
        updates: LearningObjectMetadataUpdates;
        user: UserToken;
    }): Promise<void> {
        return Promise.resolve();
    }
}
