import { Db } from 'mongodb';
import { MongoConnector } from '../../../shared/Mongo/MongoConnector';
import { FileManagerModuleDatastore } from '../../interfaces/FileManagerModuledatastore';
import {
    MultipartFileUploadStatus,
    CompletedPart,
} from '../../typings/file-manager';
import { COLLECTIONS } from '../../../drivers/MongoDriver';

export class MongoFileManagerModuleDatastore implements FileManagerModuleDatastore {
    private db: Db;
    constructor() {
        this.db = MongoConnector.client().db(process.env.CLARK_DB_NAME);
    }

    async insertMultipartUploadStatus(params: {
        status: MultipartFileUploadStatus;
    }): Promise<void> {
        await this.db
          .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
          .insertOne(params.status);
    }

    async updateMultipartUploadStatus(params: {
        id: string;
        completedPart: CompletedPart;
    }): Promise<void> {
        await this.db
          .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
          .updateOne(
            { _id: params.id },
            {
              $push: { completedParts: params.completedPart },
            },
          );
      }

    async deleteMultipartUploadStatus(params: {
        id: string;
      }): Promise<void> {
        await this.db
          .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
          .deleteOne({ _id: params.id });
      }

    async fetchMultipartUploadStatus(params: {
        id: string;
    }): Promise<MultipartFileUploadStatus> {
        const status = await this.db
            .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
            .findOne({ _id: params.id });
        return status;
    }
}
