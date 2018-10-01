import { DataStore } from "../../interfaces/DataStore";
import { LearningObjectInteractor } from "../../interactors/interactors";

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
    const err = LearningObjectInteractor.validateLearningObject(object);
    if (err) {
      return Promise.reject(err);
    }
    return dataStore.togglePublished(username, id, published);
  } catch (e) {
    return Promise.reject(`Problem toggling publish status. Error:  ${e}`);
  }
}