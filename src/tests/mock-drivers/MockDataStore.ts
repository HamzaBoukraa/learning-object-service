import { DataStore, LearningObjectQuery } from '../../interfaces/DataStore';
import {
  LearningObject,
  Collection,
  LearningOutcome,
  User,
} from '@cyber4all/clark-entity';
import {
  MultipartFileUploadStatus,
  MultipartFileUploadStatusUpdates,
  CompletedPart,
} from '../../interfaces/FileManager';
import {
  MOCK_OBJECTS, SUBMITTABLE_LEARNING_OBJECT, INVALID_LEARNING_OBJECTS,
} from '../mocks';
import { LearningObjectUpdates } from '../../types';
import { ChangeLogDocument } from '../../types/Changelog';
import {
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from '../../LearningOutcomes/types';
import { LearningObjectStats } from '../../LearningObjectStats/LearningObjectStatsInteractor';

const COLLECTIONS = {
  LEARNING_OBJECTS: 'objects',
  COLLECTIONS: 'collections',
  MULTIPART_UPLOAD_STATUSES: 'multipart-upload-statuses',
};

export class MockDataStore implements DataStore {

  deleteChangelog(learningObjectId: String): Promise<void> {
    return Promise.resolve();
  }

  connect(file: string): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): void {
    return;
  }

  updateMultipleLearningObjects(params: {
    ids: string[];
    updates: LearningObjectUpdates;
  }): Promise<void> {
    return Promise.resolve();
  }
  findParentObjectIds(params: { childId: string }): Promise<string[]> {
    return Promise.resolve([]);
  }
  fetchUser(id: string): Promise<User> {
    return Promise.resolve(MOCK_OBJECTS.USER);
  }

  getLearningOutcome(params: { id: string }): Promise<LearningOutcome> {
    return Promise.resolve(MOCK_OBJECTS.OUTCOME);
  }
  getAllLearningOutcomes(params: {
    source: string;
  }): Promise<LearningOutcome[]> {
    return Promise.resolve([]);
  }

  loadChildObjects(params: {
    id: string;
    full?: boolean;
    accessUnreleased?: boolean;
  }): Promise<LearningObject[]> {
    return Promise.resolve([]);
  }
  getLearningObjectMaterials(params: {
    id: string;
  }): Promise<LearningObject.Material> {
    return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT.materials as any);
  }
  removeFromFiles(params: { objectId: string; fileId: string }): Promise<void> {
    return Promise.resolve();
  }
  updateFileDescription(params: {
    learningObjectId: string;
    fileId: string;
    description: string;
  }): Promise<LearningObject.Material.File> {
    return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT_FILE);
  }
  findUser(username: string): Promise<string> {
    return Promise.resolve(MOCK_OBJECTS.USER.id);
  }
  peek<T>(params: {
    query: { [index: string]: string };
    fields: { [index: string]: 0 | 1 };
  }): Promise<T> {
    return Promise.resolve({} as T);
  }
  insertLearningOutcome(params: {
    source: string;
    outcome: LearningOutcomeInsert;
  }): Promise<string> {
    return Promise.resolve(MOCK_OBJECTS.OUTCOME.id);
  }
  updateLearningOutcome(params: {
    id: string;
    updates: LearningOutcomeUpdate & LearningOutcomeInsert;
  }): Promise<LearningOutcome> {
    return Promise.resolve(MOCK_OBJECTS.OUTCOME);
  }
  deleteLearningOutcome(params: { id: string }): Promise<void> {
    return Promise.resolve();
  }
  deleteAllLearningOutcomes(params: { source: string }): Promise<void> {
    return Promise.resolve();
  }
  fetchStats(params: { query: any }): Promise<LearningObjectStats> {
    return Promise.resolve({} as any);
  }

  insertLearningObject(object: LearningObject): Promise<string> {
    return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT_ID);
  }

  reorderOutcome(id: string, outcomeID: string, index: number): Promise<void> {
    return Promise.resolve();
  }

  editLearningObject(params: {
    id: string;
    updates: LearningObjectUpdates;
  }): Promise<void> {
    return Promise.resolve();
  }

  toggleLock(id: string, lock?: LearningObject.Lock): Promise<void> {
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

  createChangelog(learningObjectId: string, userId: string, changelogText: string): Promise<void> {
    return Promise.resolve();
  }

  fetchRecentChangelog(learningObjectId: string): Promise<ChangeLogDocument> {
    return Promise.resolve(MOCK_OBJECTS.CHANGELOG);
  }

  fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
  ): Promise<any[]> {
    return Promise.resolve([
      new LearningObject(MOCK_OBJECTS.LEARNING_OBJECT as any),
    ]);
  }
  fetchAllObjects(
    accessUnpublished?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{ objects: any[]; total: number }> {
    return Promise.resolve({
      objects: [new LearningObject(MOCK_OBJECTS.LEARNING_OBJECT as any)],
      total: MOCK_OBJECTS.TOTAL_RECORDS,
    });
  }

  searchObjects(params: {
    name: string;
    author: string;
    collection: string;
    length: string[];
    level: string[];
    standardOutcomeIDs: string[];
    text: string;
    accessUnpublished?: boolean;
    orderBy?: string;
    sortType?: number;
    page?: number;
    limit?: number;
  }): Promise<{ objects: any[]; total: number }> {
    return Promise.resolve({
      objects: [new LearningObject(MOCK_OBJECTS.LEARNING_OBJECT as any)],
      total: MOCK_OBJECTS.TOTAL_RECORDS,
    });
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
    return Promise.resolve([new LearningObject(MOCK_OBJECTS.LEARNING_OBJECT as any)]);
  }

  submitLearningObjectToCollection(
    username: string,
    id: string,
    collection: string,
  ): Promise<void> {
    return Promise.resolve();
  }

  unsubmitLearningObject(id: string): Promise<void> {
    return Promise.resolve();
  }

  setChildren(parentId: string, children: string[]): Promise<void> {
    return Promise.resolve();
  }

  deleteChild(parentId: string, childId: string): Promise<void> {
    return Promise.resolve();
  }

  findParentObjects(params: { query: LearningObjectQuery }): Promise<any[]> {
    return Promise.resolve([new LearningObject(MOCK_OBJECTS.LEARNING_OBJECT as any)]);
  }

  addToFiles(params: {
    id: string;
    loFile: LearningObject.Material.File;
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
  }): Promise<LearningObject.Material.File> {
    return Promise.resolve(MOCK_OBJECTS.LEARNING_OBJECT_FILE);
  }
}
