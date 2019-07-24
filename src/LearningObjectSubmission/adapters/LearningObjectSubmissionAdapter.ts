import { SubmissionPublisher } from '../interactors/SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { deleteSubmission } from '../interactors/deleteSubmission';
import { UserToken } from '../../shared/types';

export class LearningObjectSubmissionAdapter {
    private static _instance: LearningObjectSubmissionAdapter;
    private constructor(
        private publisher: SubmissionPublisher,
    ) {}
    static open(
        publisher: SubmissionPublisher,
    ) {
        LearningObjectSubmissionAdapter._instance = new LearningObjectSubmissionAdapter(
            publisher,
        );
    }
    static getInstance(): LearningObjectSubmissionAdapter {
        if (this._instance) {
            return this._instance;
        }
        throw new Error('Learning Object Submission Adapter has not been created yet.');
    }

    /**
     * deleteLearningObjectSubmission calls this
     * module's deleteSubmission function.
     *
     * @param {
     *   learningObjectId: string,
     *   userId: string,
     *   user: UserToken
     *  }
     */
    deleteLearningObjectSubmission(params: {
        learningObjectId: string,
        authorUsername: string,
        user: UserToken,
    }): Promise<void> {
        return deleteSubmission({
            publisher: this.publisher,
            learningObjectId: params.learningObjectId,
            authorUsername: params.authorUsername,
            user: params.user,
        });
    }
}
