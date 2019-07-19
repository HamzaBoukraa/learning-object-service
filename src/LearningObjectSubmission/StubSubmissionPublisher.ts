import { SubmissionPublisher } from './interactors/SubmissionPublisher';
import { LearningObject } from '../shared/entity';

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
}
