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

const COLLECTIONS = {
  LEARNING_OBJECTS: 'objects',
  COLLECTIONS: 'collections',
  MULTIPART_UPLOAD_STATUSES: 'multipart-upload-statuses',
};

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
    this.db.getCollection(COLLECTIONS.LEARNING_OBJECTS).insert(object);
    return Promise.resolve(id);
  }
  reorderOutcome(id: string, outcomeID: string, index: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  editLearningObject(id: string, object: LearningObject): Promise<void> {
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndUpdate({ _id: id }, obj => object);
    return Promise.resolve();
  }
  toggleLock(id: string, lock?: LearningObjectLock): Promise<void> {
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndUpdate({ _id: id }, (obj: LearningObject) => {
        if (lock) {
          obj.unpublish();
          obj.lock = lock;
        } else {
          obj.lock = undefined;
        }
        return obj;
      });
    return Promise.resolve();
  }
  deleteLearningObject(id: string): Promise<void> {
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndRemove({ _id: id });
    return Promise.resolve();
  }
  deleteMultipleLearningObjects(ids: string[]): Promise<void> {
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndRemove({ $in: ids });
    return Promise.resolve();
  }
  getUserObjects(username: string): Promise<string[]> {
    const objects: string[] = this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .find({ '_author._username': username })
      .map<string>(obj => obj._id);
    return Promise.resolve(objects);
  }
  findLearningObject(username: string, name: string): Promise<string> {
    const id: string = this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne({ name, '_author._username': username })._id;
    return Promise.resolve(id);
  }
  fetchLearningObject(
    id: string,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject> {
    const query: any = { _id: id };
    if (!accessUnpublished) {
      query._published = true;
    }
    let obj = this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne(query);
    if (obj) {
      obj = LearningObject.instantiate(obj);
    }

    return Promise.resolve(obj);
  }
  fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
  ): Promise<LearningObject[]> {
    const query: any = { $in: ids };
    if (!accessUnpublished) {
      query._published = true;
    }
    let objs = this.db.getCollection(COLLECTIONS.LEARNING_OBJECTS).find(query);
    if (objs && objs.length) {
      objs = objs.map(o => LearningObject.instantiate(o));
    }
    return Promise.resolve(objs);
  }
  fetchAllObjects(
    accessUnpublished?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    const query: any = {};
    if (!accessUnpublished) {
      query._published = true;
    }
    let objs = this.db.getCollection(COLLECTIONS.LEARNING_OBJECTS).find(query);
    if (objs && objs.length) {
      objs = objs.map(o => LearningObject.instantiate(o));
    }
    return Promise.resolve({ objects: objs, total: objs.length });
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
    const query: any = {};
    if (name) {
      query._name = name;
    }
    if (author) {
      query._author._username = author;
    }
    if (collection) {
      query._collection = collection;
    }
    if (length) {
      query._length = length;
    }
    if (level) {
      query._levels = level;
    }
    if (!accessUnpublished) {
      query._published = true;
    }
    let objs = this.db.getCollection(COLLECTIONS.LEARNING_OBJECTS).find(query);
    if (objs && objs.length) {
      objs = objs.map(o => LearningObject.instantiate(o));
    }
    return Promise.resolve({ objects: objs, total: objs.length });
  }
  fetchCollections(loadObjects?: boolean): Promise<Collection[]> {
    const collections = this.db.getCollection(COLLECTIONS.COLLECTIONS).find();
    return Promise.resolve(collections);
  }
  fetchCollection(name: string): Promise<Collection> {
    const collection = this.db
      .getCollection(COLLECTIONS.COLLECTIONS)
      .findOne({ name });
    return Promise.resolve(collection);
  }
  fetchCollectionMeta(name: string): Promise<any> {
    const collection = this.db
      .getCollection(COLLECTIONS.COLLECTIONS)
      .findOne({ name });
    delete collection.learningObjects;
    return Promise.resolve(collection);
  }
  fetchCollectionObjects(name: string): Promise<LearningObject[]> {
    const collection = this.db
      .getCollection(COLLECTIONS.COLLECTIONS)
      .findOne({ name });
    const ids = collection.learningObjects;
    return this.fetchMultipleObjects(ids);
  }
  togglePublished(
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndUpdate({ _id: id }, (obj: LearningObject) => {
        if (published) {
          obj.publish();
        } else {
          obj.unpublish();
        }
        return obj;
      });
    return Promise.resolve();
  }
  setChildren(parentId: string, children: string[]): Promise<void> {
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndUpdate({ _id: parentId }, obj => {
        obj._children = [...obj._children, ...children];
        return obj;
      });
    return Promise.resolve();
  }
  deleteChild(parentId: string, childId: string): Promise<void> {
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndUpdate({ _id: parentId }, obj => {
        const index = obj._children.indexOf(childId);
        obj._children.splice(index, 1);
        return obj;
      });
    return Promise.resolve();
  }
  findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    let objects = this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .find({ _children: params.query.id });
    objects = objects.map(obj => LearningObject.instantiate(obj));
    return Promise.resolve(objects);
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
    this.db
      .getCollection(COLLECTIONS.LEARNING_OBJECTS)
      .findAndUpdate({ _id: learningObjectId }, obj => {
        obj._collection = collection;
        return obj;
      });
    return Promise.resolve();
  }
  findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObjectFile> {
    throw new Error('Method not implemented.');
  }
}
