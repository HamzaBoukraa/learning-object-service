import { DataStore, LearningObjectQuery } from '../../interfaces/DataStore';
import { LearningObject, Collection } from '@cyber4all/clark-entity';
import { LearningObjectLock } from '@cyber4all/clark-entity/dist/learning-object';
import { LearningObjectFile } from '../../interactors/LearningObjectInteractor';
import {
  MultipartFileUploadStatus,
  MultipartFileUploadStatusUpdates,
  CompletedPart,
} from '../../interfaces/FileManager';
import { MOCK_OBJECTS, SUBMITTABLE_LEARNING_OBJECT, INVALID_LEARNING_OBJECTS } from '../mocks';

const COLLECTIONS = {
  LEARNING_OBJECTS: 'objects',
  COLLECTIONS: 'collections',
  MULTIPART_UPLOAD_STATUSES: 'multipart-upload-statuses',
};

export class MockDataStore implements DataStore {

  connect(file: string): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): void {
    return;
  }

  insertLearningObject(object: LearningObject): Promise<string> {
    return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT_ID);
  }

  reorderOutcome(
    id: string,
    outcomeID: string,
    index: number,
  ): Promise<void> {
    return Promise.resolve();
  }

  editLearningObject(
    id: string,
    object: LearningObject,
  ): Promise<void> {
    return Promise.resolve();
  }

  toggleLock(id: string, lock?: LearningObjectLock): Promise<void> {
    return Promise.resolve();
  }

  deleteLearningObject(id: string): Promise<void> {
    return Promise.resolve();
  }

  deleteMultipleLearningObjects(ids: string[]): Promise<void> {
    return Promise.resolve();
  }

  getUserObjects(username: string): Promise<string[]> {
    return Promise.resolve([MOCK_OBJECTS.LEARNING_OBJECT_ID]);
  }

  findLearningObject(username: string, name: string): Promise<string> {
    return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT_ID);
  }

  fetchLearningObject(
    id: string,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<any> {
    switch (id) {
      case SUBMITTABLE_LEARNING_OBJECT.id:
        return Promise.resolve(SUBMITTABLE_LEARNING_OBJECT);
      case INVALID_LEARNING_OBJECTS.NO_DESCRIPTION.id:
        return Promise.resolve(INVALID_LEARNING_OBJECTS.NO_DESCRIPTION);
      case INVALID_LEARNING_OBJECTS.NO_NAME.id:
        return Promise.resolve(INVALID_LEARNING_OBJECTS.NO_NAME);
      default:
        return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT);
    }
  }

  createChangelog(learningObjectId: String, userId: String, changelogText: String): Promise<void> {
    return Promise.resolve();
  }

  fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
  ): Promise<any[]> {
    return Promise.resolve([MOCK_OBJECTS.LEARNING_OBJECT]);
  }
  fetchAllObjects(
    accessUnpublished?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{ objects: any[]; total: number }> {
    return Promise.resolve({ objects: [MOCK_OBJECTS.LEARNING_OBJECT], total: MOCK_OBJECTS.TOTAL_RECORDS });
  }

  searchObjects(params: {
    name: string,
    author: string,
    collection: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
    page?: number,
    limit?: number,
  }): Promise<{ objects: any[]; total: number }> {
    return Promise.resolve({ objects: [MOCK_OBJECTS.LEARNING_OBJECT], total: MOCK_OBJECTS.TOTAL_RECORDS });
  }

  fetchCollections(loadObjects?: boolean): Promise<Collection[]> {
    return Promise.resolve([MOCK_OBJECTS.COLLECTION]);
  }

  fetchCollection(name: string): Promise<Collection> {
    return Promise.resolve(MOCK_OBJECTS.COLLECTION);
  }

  fetchCollectionMeta(name: string): Promise<any> {
    return Promise.resolve(MOCK_OBJECTS.COLLECTION_META);
  }

  fetchCollectionObjects(name: string): Promise<any[]> {
    return Promise.resolve([MOCK_OBJECTS.LEARNING_OBJECT]);
  }

  togglePublished(
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    return Promise.resolve();
  }

  setChildren(parentId: string, children: string[]): Promise<void> {
    return Promise.resolve();
  }

  deleteChild(parentId: string, childId: string): Promise<void> {
    return Promise.resolve();
  }

  findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<any[]> {
    return Promise.resolve([MOCK_OBJECTS.LEARNING_OBJECT]);
  }

  addToFiles(params: {
    id: string;
    loFile: LearningObjectFile;
  }): Promise<void> {
    return Promise.resolve();
  }

  insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void> {
    return Promise.resolve();
  }

  fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus> {
    return Promise.resolve(MOCK_OBJECTS.MULTIPART_UPLOAD_STATUS);
  }

  updateMultipartUploadStatus(params: {
    id: string;
    updates: MultipartFileUploadStatusUpdates;
    completedPart: CompletedPart;
  }): Promise<void> {
    return Promise.resolve();
  }

  deleteMultipartUploadStatus(params: { id: string }): Promise<void> {
    return Promise.resolve();
  }

  addToCollection(learningObjectId: string, collection: string): Promise<void> {
    return Promise.resolve();
  }

  findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObjectFile> {
    return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT_FILE);
  }
}
