import { DataStore } from '../interfaces/DataStore';
import { LearningObjectInteractor } from '../interactors/interactors';
import { SubmittableLearningObject } from '@cyber4all/clark-entity';

export async function submitForReview(
  dataStore: DataStore,
  username: string,
  id: string,
  collection: string,
): Promise<void> {
  try {
    const object = await dataStore.fetchLearningObject(id, true, true);
    const _ = new SubmittableLearningObject(object);
    await dataStore.submitLearningObjectToCollection(username, id, collection);
  } catch (e) {
    console.log(e);
    // TODO: Convey that this is an internal server error
    return Promise.reject(
      e instanceof Error ? e : new Error(`Problem submitting learning object.`),
    );
  }
}
export async function cancelSubmission(
  dataStore: DataStore,
  id: string,
): Promise<void> {
  await dataStore.unsubmitLearningObject(id);
}
