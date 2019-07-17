import { FileMetaDatastore } from '../../interfaces';
import {
  FileMetadataDocument,
  FileMetadataInsert,
  FileMetadataUpdate,
} from '../../typings';
import { Db, ObjectId } from 'mongodb';
import { MongoConnector } from '../../../shared/Mongo/MongoConnector';

const FILES_DB = process.env.FILE_DB_NAME;

const FILE_META_COLLECTION = 'files';
const MIME_TYPE_COLLECTION = 'mime-types';

export class MongoFileMetaDatastore implements FileMetaDatastore {
  private db: Db;
  constructor() {
    this.db = MongoConnector.client().db(FILES_DB);
  }

  /**
   * @inheritdoc
   *
   * Searches for a mimeType using regex pattern of given extension
   *
   * @returns {Promise<string>}
   * @memberof MongoFileMetaDatastore
   */
  async fetchMimeType(extension: string): Promise<string> {
    const type = await this.db
      .collection(MIME_TYPE_COLLECTION)
      .findOne<{ mimeType: string }>(
        { extension: new RegExp(extension, 'i') },
        { projection: { _id: 0, mimeType: 1 } },
      );
    if (type) {
      return type.mimeType;
    }
    return null;
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async findFileMetadata({
    learningObjectId,
    learningObjectRevision,
    fullPath,
  }: {
    learningObjectId: string;
    learningObjectRevision: number;
    fullPath: string;
  }): Promise<FileMetadataDocument> {
    const doc = await this.db
      .collection(FILE_META_COLLECTION)
      .findOne({ learningObjectId, learningObjectRevision, fullPath });
    if (doc) {
      return this.mapMongoIdToId(doc);
    }
    return null;
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async fetchFileMeta(id: string): Promise<FileMetadataDocument> {
    const doc = await this.db
      .collection<FileMetadataDocument & { _id: ObjectId }>(
        FILE_META_COLLECTION,
      )
      .findOne({ _id: new ObjectId(id) });
    if (doc) {
      return this.mapMongoIdToId(doc);
    }
    return null;
  }

  /**
   * Maps Documents `_id` ObjectId to `id` string
   *
   * @private
   * @param {(any & { _id: ObjectId })} doc
   * @returns
   * @memberof MongoFileMetaDatastore
   */
  private mapMongoIdToId(doc: any & { _id: ObjectId }) {
    doc.id = doc._id.toHexString();
    delete doc._id;
    return doc;
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  fetchAllFileMeta(learningObjectId: string): Promise<FileMetadataDocument[]> {
    return this.db
      .collection<FileMetadataDocument & { _id: ObjectId }>(
        FILE_META_COLLECTION,
      )
      .find({ learningObjectId })
      .toArray()
      .then(docs => docs.map(this.mapMongoIdToId));
  }

  /**
   * @inheritdoc
   *
   * @memberof MongoFileMetaDatastore
   */
  async insertFileMeta(
    fileMeta: FileMetadataInsert,
  ): Promise<FileMetadataDocument> {
    const result = await this.db
      .collection(FILE_META_COLLECTION)
      .insertOne(fileMeta);
    return { ...fileMeta, id: result.insertedId.toHexString() };
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
  async deleteAllFileMetadata(learningObjectId: string): Promise<void> {
    await this.db
      .collection(FILE_META_COLLECTION)
      .deleteMany({ learningObjectId });
  }
}
