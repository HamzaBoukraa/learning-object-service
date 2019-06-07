import { Submission } from './types/Submission';

export interface SubmissionDataStore {
  recordSubmission(submission: Submission): Promise<void>;
  recordCancellation(learningObjectId: string): Promise<void>;
  fetchSubmission(collection: string, learningObjectId: string): Promise<Submission>;
  fetchRecentSubmission(learningObjectId: string): Promise<Submission>;
}
