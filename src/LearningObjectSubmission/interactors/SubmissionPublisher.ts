import { LearningObject } from '../../shared/entity';
export interface SubmissionPublisher {
  /**
   * publishSubmission makes a Learning Object searchable by reviewers, curators,
   * editors, and admins.
   * @param submission the Learning Object being submitted to a collection
   */
  publishSubmission(submission: LearningObject): Promise<void>;
  /**
   * withdrawlSubmission removes a submitted Learning Object from access by
   * reviewers, curators, editors, or admins.
   * @param learningObjectID the ID of the Learning Object being withdrawn
   */
  withdrawlSubmission(learningObjectID: string): Promise<void>;
}
