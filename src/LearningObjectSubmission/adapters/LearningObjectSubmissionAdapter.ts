import { SubmissionPublisher } from '../interactors/SubmissionPublisher';
import { LearningObject } from '../../shared/entity';
import { deleteSubmission } from '../interactors/deleteSubmission';
import { UserToken, LearningObjectMetadataUpdates } from '../../shared/types';
import { applySubmissionUpdates } from '../interactors';

export class LearningObjectSubmissionAdapter {
  private static _instance: LearningObjectSubmissionAdapter;
  private constructor(private publisher: SubmissionPublisher) {}
  static open(publisher: SubmissionPublisher) {
    LearningObjectSubmissionAdapter._instance = new LearningObjectSubmissionAdapter(
      publisher,
    );
  }
  static getInstance(): LearningObjectSubmissionAdapter {
    if (this._instance) {
      return this._instance;
    }
    throw new Error(
      'Learning Object Submission Adapter has not been created yet.',
    );
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
  deleteSubmission(params: {
    learningObjectId: string;
    authorUsername: string;
    user: UserToken;
  }): Promise<void> {
    return deleteSubmission({
      publisher: this.publisher,
      learningObjectId: params.learningObjectId,
      authorUsername: params.authorUsername,
      user: params.user,
    });
  }

  /**
   * Calls the updateSubmission interactor function.
   */
  applySubmissionUpdates({
    learningObjectId,
    updates,
    user,
  }: {
    learningObjectId: string;
    updates: LearningObjectMetadataUpdates;
    user: UserToken;
  }): Promise<void> {
    return applySubmissionUpdates({
      publisher: this.publisher,
      user,
      learningObjectId,
      updates,
    });
  }
}
