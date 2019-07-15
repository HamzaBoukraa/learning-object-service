import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { Readable } from 'stream';
import { reportError } from '../../../shared/SentryConnector';
import { AWS_SDK_CONFIG } from '../../config/aws-sdk.config';

import { FileManager } from '../../interfaces/FileManager';
import { FileUpload } from '../../../shared/types';

AWS.config.credentials = AWS_SDK_CONFIG.credentials;

const BUCKETS = {
  MAIN: process.env.WORKING_FILES_BUCKET,
};

export class S3FileManager implements FileManager {
  private s3 = new AWS.S3({ region: AWS_SDK_CONFIG.region });


  /**
   * @inheritdoc
   *
   * Uploads file to storage location
   *
   * @returns {Promise<void>}
   * @memberof S3FileManager
   */
  async upload({ authorUsername, learningObjectId, file }: { authorUsername: string, learningObjectId: string, file: FileUpload }): Promise<void> {
    const Key: string = `${authorUsername}/${learningObjectId}/${file.path}`;
    const uploadParams = {
      Key,
      Bucket: BUCKETS.MAIN,
      Body: file.data,
    };
    await this.s3.upload(uploadParams).promise();
  }

  /**
   * @inheritdoc
   *
   * Deletes Specified file from storage
   *
   * @returns {Promise<void>}
   * @memberof S3FileManager
   */
  async delete({ authorUsername, learningObjectId, path }: {
    authorUsername: string;
    learningObjectId: string; path: string
  }): Promise<void> {
    const Key: string = `${authorUsername}/${learningObjectId}/${path}`;
    const deleteParams = {
      Key,
      Bucket: BUCKETS.MAIN,
    };
    return await this.deleteObject(deleteParams);
  }

  /**
   *
   * @inheritdoc
   *
   * Deletes all objects within a specified folder
   * The function stores all nested objects in an array called listedObjects
   * If no nested objects exist, the function exits
   * If nested objects do exists, the key of each object is mapped to an array
   * in the deleteObjectParams object.
   * The objects are then deleted.
   *
   * Finally, the function checks the IsTruncated property.
   * This property is a flag that indicates whether or not Amazon S3 returned all of
   * the results that satisfied the search criteria.
   *
   * If it is set to true, the deleteFolder function is called again.
   *
   * This continues until all objects in the folder are deleted.
   *
   * @returns {Promise<void>}
   * @memberof S3FileManager
   */
  async deleteFolder({ authorUsername, learningObjectId, path }: { authorUsername: string; learningObjectId: string; path: string }): Promise<void> {
    if (path[path.length] !== '/') {
      throw Error('Path to delete a folder must end with a /');
    }
    const storagePath: string = `${authorUsername}/${learningObjectId}/${path}`.replace(/\/\//ig, '/');
    const listObjectsParams = {
      Key: storagePath,
      Bucket: BUCKETS.MAIN,
    };
    const listedObjects = await this.s3.listObjectsV2(listObjectsParams).promise();
    if (listedObjects.Contents.length === 0) return;
    const deleteObjectsParams = {
      Bucket: BUCKETS.MAIN,
      Delete: { Objects: <any>[] },
    };

    listedObjects.Contents.forEach(({ Key }) => {
      deleteObjectsParams.Delete.Objects.push({ Key });
    });

    await this.s3.deleteObjects(deleteObjectsParams).promise();

    if (listedObjects.IsTruncated) await this.deleteFolder({ authorUsername, learningObjectId, path });
  }

  /**
   * @inheritdoc
   *
   * @returns {Readable}
   * @memberof S3FileManager
   */
  streamFile({ authorUsername, learningObjectId, path }: { authorUsername: string; learningObjectId: string; path: string }): Readable {
    const Key: string = `${authorUsername}/${learningObjectId}/${path}`;
    const fetchParams = {
      Key,
      Bucket: BUCKETS.MAIN,
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
   * @returns {Promise<void>}
   * @memberof S3FileManager
   */
  private async deleteObject(params: any): Promise<void> {
    await this.s3.deleteObject(params).promise();
  }

  /**
   * @inheritdoc
   *
   * Sends a HEAD request to fetch metadata for a given file.
   * Resolves true if the request completes, and false if the request
   * stream encounters an error at any point.
   *
   * @param path the file path in S3
   */
  async hasAccess({ authorUsername, learningObjectId, path }: { authorUsername: string; learningObjectId: string; path: string }): Promise<boolean> {
    const Key: string = `${authorUsername}/${learningObjectId}/${path}`;
    const fetchParams = {
      Key,
      Bucket: BUCKETS.MAIN,
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
