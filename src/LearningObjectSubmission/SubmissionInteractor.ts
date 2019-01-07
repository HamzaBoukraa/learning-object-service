import { DataStore } from '../interfaces/DataStore';
import { LearningObjectInteractor } from '../interactors/interactors';

export async function submitForReview(
  dataStore: DataStore,
  username: string,
  id: string,
  collection: string,
): Promise<void> {
  try {
    const object = await dataStore.fetchLearningObject(id, true, true);
    // TODO: learning object validation should be moved to the entity level
    const errorMessage = LearningObjectInteractor.validateLearningObject(
      object,
    );

    if (errorMessage) {
      return Promise.reject(errorMessage);
    }

    await dataStore.submitLearningObjectToCollection(username, id, collection);
  } catch (e) {
    console.log(e);
    // TODO: Convey that this is an internal server error
    return Promise.reject(new Error(`Problem submitting learning object.`));
  }
}
export async function cancelSubmission(
  dataStore: DataStore,
  id: string,
): Promise<void> {
  await dataStore.unsubmitLearningObject(id);
}
