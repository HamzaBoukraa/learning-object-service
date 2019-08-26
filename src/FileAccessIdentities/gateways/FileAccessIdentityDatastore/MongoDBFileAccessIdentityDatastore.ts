import { Db } from 'mongodb';
import { MongoConnector } from '../../../shared/Mongo/MongoConnector';
import { FileAccessIdentityDatastore } from '../../shared/abstract-classes/FileAccessIdentityDatastore';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';

const DB = process.env.CLARK_DB_NAME;

export class MongoDBFileAccessIdentityDatastore
implements FileAccessIdentityDatastore {
  private db: Db;
  constructor() {
    this.db = MongoConnector.client().db(DB);
  }

  async insertFileAccessIdentity({
    username,
    fileAccessIdentity,
  }: {
    username: string;
    fileAccessIdentity: string;
  }): Promise<void> {
    await this.db.collection('file-access-ids').insertOne({
      username,
      fileAccessId: fileAccessIdentity,
    });
  }

  async findFileAccessIdentity(username: string): Promise<string | Error> {
    const fileAccessInfo = await this.db
      .collection('file-access-ids')
      .find({ username }, { projection: { fileAccessId: 1 } })
      .limit(1)
      .toArray();
    return fileAccessInfo[0] ?
      fileAccessInfo[0].fileAccessId
      : new ResourceError(
        'not found',
        ResourceErrorReason.NOT_FOUND,
      );
  }

  async updateFileAccessIdentity({
    username,
    fileAccessIdentity,
  }: {
    username: string;
    fileAccessIdentity: string;
  }): Promise<void> {
    await this.db
      .collection('file-access-ids')
      .updateOne({ username }, { $set: { fileAccessId: fileAccessIdentity } });
  }
}
