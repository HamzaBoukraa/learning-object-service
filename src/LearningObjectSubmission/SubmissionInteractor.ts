import { DataStore } from '../interfaces/DataStore';
import { LearningObjectInteractor } from '../interactors/interactors';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';

export async function submitForReview(
  dataStore: DataStore,
  username: string,
  id: string,
): Promise<void> {
  try {
    const object = await dataStore.fetchLearningObject(id, true, true);
    object.publish();
    // TODO: learning object validation should be moved to the entity level
    const errorMessage = LearningObjectInteractor.validateLearningObject(object);
    if (errorMessage) {
      return Promise.reject(errorMessage);
    }
    return dataStore.togglePublished(username, id, true);
  } catch (e) {
    // TODO: Convey that this is an internal server error
    return Promise.reject(new Error(`Problem submitting learning object.`));
  }
}
export async function cancelSubmission(
  dataStore: DataStore,
  username: string,
  id: string,
): Promise<void> {
  return dataStore.togglePublished(username, id, false);
}

export async function createChangelog(
  dataStore: DataStore,
  learningObjectId: String,
  userId: String,
  changelogText: String
): Promise<void> {
  try {
      await dataStore.createChangelog(learningObjectId, userId, changelogText);
  } catch (e) { 
    console.error(e);
    Promise.reject(e);
  }
}
