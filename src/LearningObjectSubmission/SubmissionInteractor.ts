import { DataStore } from '../interfaces/DataStore';
import { SubmittableLearningObject } from '@cyber4all/clark-entity';
import { updateReadme } from '../LearningObjects/LearningObjectInteractor';
import { FileManager } from '../interfaces/interfaces';

export async function submitForReview(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  username: string;
  id: string;
  collection: string;
}): Promise<void> {
  try {
    const object = await params.dataStore.fetchLearningObject(
      params.id,
      true,
      true,
    );
    const _ = new SubmittableLearningObject(object);
    await params.dataStore.submitLearningObjectToCollection(
      params.username,
      params.id,
      params.collection,
    );
    await updateReadme({
      dataStore: params.dataStore,
      fileManager: params.fileManager,
      id: params.id,
    });
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
