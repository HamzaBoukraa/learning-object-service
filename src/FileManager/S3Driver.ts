import 'dotenv/config';
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { Readable } from 'stream';
import { reportError } from '../drivers/SentryConnector';
import {
  CompletedPart,
  CompletedPartList,
  FileUpload,
} from '../interfaces/FileManager';
import { FileManager } from '../interfaces/interfaces';
import { AWS_SDK_CONFIG } from './aws-sdk.config';

AWS.config.credentials = AWS_SDK_CONFIG.credentials;

const BUCKETS = {
  WORKING_FILES: process.env.WORKING_FILES_BUCKET,
  RELEASED_FILES: process.env.RELEASED_FILES_BUCKET,
};

export class S3Driver implements FileManager {
  private s3 = new AWS.S3({ region: AWS_SDK_CONFIG.region });

  /**
   * Uploads single file
   *
   * @param {{ file: FileUpload }} params
   * @returns {Promise<string>}
   * @memberof S3Driver
   */
  public async upload(params: { file: FileUpload }): Promise<string> {
    try {
      const uploadParams = {
        Bucket: AWS_S3_BUCKET,
        Key: params.file.path,
        ACL: AWS_S3_ACL,
        Body: params.file.data,
      };
      const response = await this.s3.upload(uploadParams).promise();
      return response.Location;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async initMultipartUpload(params: { path: string }): Promise<string> {
    const createParams = {
      Bucket: AWS_S3_BUCKET,
      ACL: AWS_S3_ACL,
      Key: params.path,
    };
    const createdUpload = await this.s3
      .createMultipartUpload(createParams)
      .promise();
    return createdUpload.UploadId;
  }

  public async uploadPart(params: {
    path: string;
    data: any;
    partNumber: number;
    uploadId: string;
  }): Promise<CompletedPart> {
    const partUploadParams = {
      Bucket: AWS_S3_BUCKET,
      Key: params.path,
      Body: params.data,
      PartNumber: params.partNumber,
      UploadId: params.uploadId,
    };
    // Upload chunk
    const uploadData = await this.s3.uploadPart(partUploadParams).promise();
    return {
      ETag: uploadData.ETag,
      PartNumber: params.partNumber,
    };
  }

  public async completeMultipartUpload(params: {
    path: string;
    uploadId: string;
    completedPartList: CompletedPartList;
  }): Promise<string> {
    params.completedPartList.sort(
      (partA, partB) => partA.PartNumber - partB.PartNumber,
    );
    const completedParams = {
      Bucket: AWS_S3_BUCKET,
      Key: params.path,
      UploadId: params.uploadId,
      MultipartUpload: {
        Parts: params.completedPartList,
      },
    };
    // Finalize upload
    const completedUploadData = await this.s3
      .completeMultipartUpload(completedParams)
      .promise();
    return completedUploadData.Location;
  }

  /**
   * Cancels chunk upload
   *
   * @param {{
   *     path: string;
   *     uploadId: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  async abortMultipartUpload(params: {
    path: string;
    uploadId: string;
  }): Promise<void> {
    const abortUploadParams = {
      Bucket: AWS_S3_BUCKET,
      Key: params.path,
      UploadId: params.uploadId,
    };
    await this.s3.abortMultipartUpload(abortUploadParams).promise();
  }

  /**
   * Deletes Specified file from storage
   *
   * @param {string} path
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  public async delete(params: { path: string }): Promise<void> {
    try {
      const deleteParams = {
        Bucket: AWS_S3_BUCKET,
        Key: params.path,
      };
      return await this.deleteObject(deleteParams);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Deletes all files in storage
   *
   * @param {string} path
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  public async deleteAll(params: { path: string }): Promise<void> {
    const listParams = {
      Bucket: AWS_S3_BUCKET,
      Prefix: params.path,
    };

    const listedObjects = await this.s3.listObjectsV2(listParams).promise();
    if (listedObjects.Contents && listedObjects.Contents.length) {
      const deleteParams = {
        Bucket: AWS_S3_BUCKET,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
        },
      };
      await this.s3.deleteObjects(deleteParams).promise();
      if (listedObjects.IsTruncated) {
        return await this.deleteAll(params);
      }
    }
  }

  streamFile(params: { path: string }): Readable {
    const fetchParams = {
      Bucket: AWS_S3_BUCKET,
      Key: params.path,
    };
    const stream = this.s3
      .getObject(fetchParams)
      .createReadStream()
      .on('error', (err: AWSError) => {
        // TimeoutError will be thrown if the client cancels the download
        if (err.code !== 'TimeoutError') {
          reportError(err);
        }
      });
    return stream;
  }

  /**
   * Deletes Object From S3
   *
   * @private
   * @param {any} params
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  private async deleteObject(params: any): Promise<void> {
    try {
      await this.s3.deleteObject(params).promise();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Sends a HEAD request to fetch metadata for a given file.
   * Resolves true if the request completes, and false if the request
   * stream encounters an error at any point.
   *
   * @param path the file path in S3
   */
  async hasAccess(path: string): Promise<boolean> {
    const fetchParams = {
      Bucket: AWS_S3_BUCKET,
      Key: path,
    };
    return new Promise<boolean>(resolve => {
      this.s3
        .headObject(fetchParams)
        .createReadStream()
        .on('finish', _ => resolve(true))
        .on('error', (e: AWSError) => {
          resolve(false);
          reportError(e);
        });
    });
  }
}
