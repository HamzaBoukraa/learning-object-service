import { DataStore, LearningObjectQuery } from '../../interfaces/DataStore';
import { LearningObject, Collection } from '@cyber4all/clark-entity';
import { LearningObjectLock } from '@cyber4all/clark-entity/dist/learning-object';
import { LearningObjectFile } from '../../interactors/LearningObjectInteractor';
import {
  MultipartFileUploadStatus,
  MultipartFileUploadStatusUpdates,
  CompletedPart,
} from '../../interfaces/FileManager';
import * as fs from 'fs';
import * as loki from 'lokijs';
import * as uuid from 'uuid';

export class MockDataStore implements DataStore {
  private db: loki;
  connect(file: string): Promise<void> {
    try {
      this.db = new loki('mock-db');
      const data = fs.readFileSync(file, 'utf-8');
      this.db.loadJSON(data);
      console.log('Connected');
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(`Problem initializing data store. Error: ${e}`);
    }
  }
  disconnect(): void {
    this.db.deleteDatabase();
    console.log('Disconnected');
  }
  insertLearningObject(object: LearningObject): Promise<string> {
    const id = uuid();
    object._id = id;
    return Promise.resolve(id);
  }
  reorderOutcome(
    objectID: string,
    outcomeID: string,
    index: number,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  editLearningObject(id: string, object: LearningObject): Promise<void> {
    throw new Error('Method not implemented.');
  }
  toggleLock(id: string, lock?: LearningObjectLock): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteLearningObject(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteMultipleLearningObjects(ids: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getUserObjects(username: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  findLearningObject(username: string, name: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  fetchLearningObject(
    id: string,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject> {
    throw new Error('Method not implemented.');
  }
  fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
  ): Promise<LearningObject[]> {
    throw new Error('Method not implemented.');
  }
  fetchAllObjects(
    accessUnpublished?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    throw new Error('Method not implemented.');
  }
  searchObjects(
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
  ): Promise<{ objects: LearningObject[]; total: number }> {
    throw new Error('Method not implemented.');
  }
  fetchCollections(loadObjects?: boolean): Promise<Collection[]> {
    throw new Error('Method not implemented.');
  }
  fetchCollection(name: string): Promise<Collection> {
    throw new Error('Method not implemented.');
  }
  fetchCollectionMeta(name: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  fetchCollectionObjects(name: string): Promise<LearningObject[]> {
    throw new Error('Method not implemented.');
  }
  togglePublished(
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
  setChildren(parentId: string, children: string[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteChild(parentId: string, childId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    throw new Error('Method not implemented.');
  }
  addToFiles(params: {
    id: string;
    loFile: LearningObjectFile;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus> {
    throw new Error('Method not implemented.');
  }
  updateMultipartUploadStatus(params: {
    id: string;
    updates: MultipartFileUploadStatusUpdates;
    completedPart: CompletedPart;
  }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  deleteMultipartUploadStatus(params: { id: string }): Promise<void> {
    throw new Error('Method not implemented.');
  }
  addToCollection(learningObjectId: string, collection: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObjectFile> {
    throw new Error('Method not implemented.');
  }
}
