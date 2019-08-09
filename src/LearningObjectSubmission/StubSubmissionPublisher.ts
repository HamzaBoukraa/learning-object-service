import { SubmissionPublisher } from './interactors/SubmissionPublisher';
import { LearningObject } from '../shared/entity';
import { LearningObjectMetadataUpdates } from '../shared/types';

export class StubSubmissionPublisher implements SubmissionPublisher {
    /**
     * @inheritdoc
     */
    publishSubmission(submission: LearningObject): Promise<void> {
        return Promise.resolve();
    }

    /**
     * @inheritdoc
     */
    deleteSubmission(learningObjectID: string): Promise<void> {
       return Promise.resolve();
    }
    /**
     * @inheritdoc
     */
    updateSubmission(params: {
        learningObjectId: string;
        updates: LearningObjectMetadataUpdates;
    }): Promise<void> {
        return Promise.resolve();
    }
}
