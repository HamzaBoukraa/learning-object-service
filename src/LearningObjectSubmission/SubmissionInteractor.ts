import { DataStore } from '../interfaces/DataStore';
import { LearningObjectInteractor } from '../interactors/interactors';

export async function togglePublished(
  dataStore: DataStore,
  username: string,
  id: string,
  published: boolean,
): Promise<void> {
  try {
    const object = await dataStore.fetchLearningObject(id, true, true);
    published ? object.publish() : object.unpublish();
    // TODO: learning object validation should be moved to the entity level
    const errorMessage = LearningObjectInteractor.validateLearningObject(object);
    if (errorMessage) {
      return Promise.reject(errorMessage);
    }
    return dataStore.togglePublished(username, id, published);
  } catch (e) {
    return Promise.reject(new Error(`Problem toggling publish status.`));
  }
}
