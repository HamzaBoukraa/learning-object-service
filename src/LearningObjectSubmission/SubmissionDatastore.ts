import { Submission } from './types/Submission';

export interface SubmissionDataStore {
  recordSubmission(submission: Submission): Promise<void>;
  recordCancellation(learningObjectId: string): Promise<void>;
  fetchSubmission(collection: string, learningObjectId: string): Promise<Submission>;
  fetchRecentSubmission(learningObjectId: string): Promise<Submission>;
  /**
   * Checks if a Learning Object has been submitted before.
   * @param learningObjectId the ID of the Learning Object
   */
  hasSubmission(learningObjectId: string, collection: string): Promise<boolean>;
}
