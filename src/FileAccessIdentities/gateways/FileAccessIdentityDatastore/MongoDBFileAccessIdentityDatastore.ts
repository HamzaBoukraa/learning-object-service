import { Db } from 'mongodb';
import { MongoConnector } from '../../../shared/Mongo/MongoConnector';
import { FileAccessIdentityDatastore } from '../../shared/abstract-classes/FileAccessIdentityDatastore';

const DB = process.env.CLARK_DB_NAME;

export class MongoDBFileAccessIdentityDatastore implements FileAccessIdentityDatastore {
    private db: Db;
    constructor() {
        this.db = MongoConnector.client().db(DB);
    }

    async insertFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string,
        fileAccessIdentity: string,
    }): Promise<void> {
            await this.db.collection('file-access-ids')
                .insertOne(
                    {
                        username,
                        fileAccessId: fileAccessIdentity,
                    },
                );
        }

    async findFileAccessIdentity(username: string): Promise<string> {
        return this.db.collection('file-access-ids')
            .find(
                { username },
                { projection: { fileAccessId: 1 }},
            )
            .limit(1)
            .toArray()[0];
    }

    async updateFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string,
        fileAccessIdentity: string,
    }): Promise<void> {
        await this.db.collection('file-access-ids')
            .updateOne(
                { username },
                { $set: { fileAccessId: fileAccessIdentity }},
            );
    }
}
