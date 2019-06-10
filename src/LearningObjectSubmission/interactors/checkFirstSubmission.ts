import { SubmissionDataStore } from '../SubmissionDataStore';

/**
 * Check if learning object is being submitted to a collection
 * for the first time.
 *
 * @param dataStore instance of dataStore
 * @param emailVerified boolean to check if current user has a verified email
 * @param userId id of learning object author
 * @param learningObjectId id of the learning object to search for
 * @param collection name of collection to search for in submission collection
 */
export async function checkFirstSubmission(params: {
  dataStore: SubmissionDataStore;
  collection: string;
  learningObjectId: string;
  userId: string;
  emailVerified: boolean;
}): Promise<boolean> {
  return await params.dataStore.hasSubmission(params.collection, params.learningObjectId);
}
