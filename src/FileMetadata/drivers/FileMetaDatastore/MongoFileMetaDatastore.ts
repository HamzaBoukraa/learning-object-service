import { FileMetaDatastore } from '../../interfaces';
import {
  FileMetadataDocument,
  FileMetadataInsert,
  FileMetadataUpdate,
} from '../../typings';
import { Db, ObjectId } from 'mongodb';
import { MongoConnector } from '../../../shared/Mongo/MongoConnector';

const FILES_DB = process.env.FILES_DB_NAME;

const FILE_META_COLLECTION = 'files';

export class MongoFileMetaDatastore implements FileMetaDatastore {
  private db: Db;
  constructor() {
    this.db = MongoConnector.client().db(FILES_DB);
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async fileMetaExists({
    learningObjectId,
    learningObjectRevision,
    fullPath,
  }: {
    learningObjectId: string;
    learningObjectRevision: string;
    fullPath: string;
  }): Promise<boolean> {
    const doc = await this.db
      .collection(FILE_META_COLLECTION)
      .findOne(
        { learningObjectId, learningObjectRevision, fullPath },
        { projection: { _id: 1 } },
      );
    if (doc) {
      return true;
    }

    return false;
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  fetchFileMeta(id: string): Promise<FileMetadataDocument> {
    return this.db
      .collection<FileMetadataDocument>(FILE_META_COLLECTION)
      .findOne({ _id: new ObjectId(id) });
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  fetchAllFileMeta({
    learningObjectId,
    learningObjectRevision,
  }: {
    learningObjectId: string;
    learningObjectRevision: number;
  }): Promise<FileMetadataDocument[]> {
    return this.db
      .collection<FileMetadataDocument>(FILE_META_COLLECTION)
      .find({ learningObjectId, learningObjectRevision })
      .toArray();
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async insertFileMeta(fileMeta: FileMetadataInsert): Promise<string> {
    const result = await this.db
      .collection(FILE_META_COLLECTION)
      .insertOne(fileMeta);
    return result.insertedId.toHexString();
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async updateFileMeta({
    id,
    updates,
  }: {
    id: string;
    updates: FileMetadataUpdate;
  }): Promise<void> {
    await this.db
      .collection<FileMetadataDocument>(FILE_META_COLLECTION)
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async deleteFileMeta(id: string): Promise<void> {
    await this.db
      .collection(FILE_META_COLLECTION)
      .deleteOne({ _id: new ObjectId(id) });
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async deleteAllFileMeta({
    learningObjectId,
    learningObjectRevision,
  }: {
    learningObjectId: string;
    learningObjectRevision: number;
  }): Promise<void> {
    await this.db
      .collection(FILE_META_COLLECTION)
      .deleteMany({ learningObjectId, learningObjectRevision });
  }
}
