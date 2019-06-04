import { Submission } from './types/Submission';

export interface SubmissionDataStore {
  submitLearningObjectToCollection(
    username: string,
    id: string,
    collection: string,
  ): Promise<void>;
  recordSubmission(submission: Submission): Promise<void>;
  recordCancellation(learningObjectId: string): Promise<void>;
  fetchSubmission(collection: string, learningObjectId: string): Promise<Submission>;
  fetchRecentSubmission(learningObjectId: string): Promise<Submission>;
  unsubmitLearningObject(id: string): Promise<void>;
}
