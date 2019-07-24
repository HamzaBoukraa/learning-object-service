import { LearningObject } from '../../shared/entity';
export interface SubmissionPublisher {
  /**
   * publishSubmission makes a Learning Object searchable by reviewers, curators,
   * editors, and admins.
   * @param submission the Learning Object being submitted to a collection
   */
  publishSubmission(submission: LearningObject): Promise<void>;
  /**
   * updateSubmission modifies a published submission to make changes searchable by
   * reviewers, curators, editors, and admins.
   */
  updateSubmission(
    params: {
      learningObjectId: string,
      updates: Partial<LearningObject>,
  }): Promise<void>;
  /**
   * deleteSubmission removes a submitted Learning Object from access by
   * reviewers, curators, editors, or admins.
   *
   * @param learningObjectID the ID of the Learning Object being withdrawn
   */
  deleteSubmission(learningObjectID: string): Promise<void>;
}
