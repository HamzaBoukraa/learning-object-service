import * as AWS from 'aws-sdk';
import { AWSError, S3 } from 'aws-sdk';
import { Readable } from 'stream';
import { reportError } from '../../../shared/SentryConnector';

import { FileManager } from '../../interfaces/FileManager';
import { FileUpload } from '../../../shared/types';
import { FileAccessIdentitiesAdapter } from '../../../FileAccessIdentities/adapters/FileAccessIdentitiesAdapter/FileAccessIdentitiesAdapter';

export const AWS_SDK_CONFIG = {
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

AWS.config.credentials = AWS_SDK_CONFIG.credentials;

const S3_CONFIG = {
  FILES_BUCKET: process.env.FILES_BUCKET,
  REGION: process.env.FILES_BUCKET_REGION,
};

const COGNITO_CONFIG = {
  CLARK_IDENTITY_POOL_ID: process.env.CLARK_COGNITO_IDENTITY_POOL_ID,
  CLARK_ADMIN_IDENTITY_POOL_ID:
    process.env.CLARK_ADMIN_COGNITO_IDENTITY_POOL_ID,
  REGION: process.env.COGNITO_REGION,
};

/**
 * This is the error that the `lookupDeveloperIdentity` API call returns when a developer identity
 * exists in another pool and not the pool the look up is performed in.
 * Not sure why it doesn't just return a NotFound or null, but 🤷‍. (That's AWS for you.)
 */
const COGNITO_IDENTITY_NOT_FOUND = 'NotAuthorizedException';

export class S3FileManager implements FileManager {
  private s3 = new AWS.S3({ region: S3_CONFIG.REGION });
  private cognito = new AWS.CognitoIdentity({ region: COGNITO_CONFIG.REGION });

  /**
   * @inheritdoc
   *
   * Uploads file to storage location
   *
   * @returns {Promise<void>}
   * @memberof S3FileManager
   */
  async upload({
    authorUsername,
    learningObjectId,
    learningObjectRevisionId,
    file,
  }: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    file: FileUpload;
  }): Promise<void> {
    const Key: string = await this.generateObjectPath({
      authorUsername,
      learningObjectId,
      learningObjectRevisionId,
      path: file.path,
    });
    const uploadParams = {
      Key,
      Bucket: S3_CONFIG.FILES_BUCKET,
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
  async delete({
    authorUsername,
    learningObjectId,
    learningObjectRevisionId,
    path,
  }: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<void> {
    const Key: string = await this.generateObjectPath({
      authorUsername,
      learningObjectId,
      learningObjectRevisionId,
      path,
    });
    const deleteParams = {
      Key,
      Bucket: S3_CONFIG.FILES_BUCKET,
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
  async deleteFolder({
    authorUsername,
    learningObjectId,
    learningObjectRevisionId,
    path,
  }: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<void> {
    if (path[path.length] !== '/') {
      throw Error('Path to delete a folder must end with a /');
    }
    const storagePath: string = (await this.generateObjectPath({
      authorUsername,
      learningObjectId,
      learningObjectRevisionId,
      path,
    })).replace(/\/\//gi, '/');

    const listObjectsParams = {
      Key: storagePath,
      Bucket: S3_CONFIG.FILES_BUCKET,
    };
    const listedObjects = await this.s3
      .listObjectsV2(listObjectsParams)
      .promise();
    if (listedObjects.Contents.length === 0) return;
    const deleteObjectsParams = {
      Bucket: S3_CONFIG.FILES_BUCKET,
      Delete: { Objects: <any>[] },
    };

    listedObjects.Contents.forEach(({ Key }) => {
      deleteObjectsParams.Delete.Objects.push({ Key });
    });

    await this.s3.deleteObjects(deleteObjectsParams).promise();

    if (listedObjects.IsTruncated)
      await this.deleteFolder({
        authorUsername,
        learningObjectId,
        learningObjectRevisionId,
        path,
      });
  }

  /**
   * @inheritdoc
   *
   * @returns {Readable}
   * @memberof S3FileManager
   */
  async streamFile({
    authorUsername,
    learningObjectId,
    learningObjectRevisionId,
    path,
  }: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<Readable> {
    const Key: string = await this.generateObjectPath({
      authorUsername,
      learningObjectId,
      learningObjectRevisionId,
      path,
    });
    const fetchParams = {
      Key,
      Bucket: S3_CONFIG.FILES_BUCKET,
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
  async hasAccess({
    authorUsername,
    learningObjectId,
    learningObjectRevisionId,
    path,
  }: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<boolean> {
    const Key: string = await this.generateObjectPath({
      authorUsername,
      learningObjectId,
      learningObjectRevisionId,
      path,
    });
    const fetchParams = {
      Key,
      Bucket: S3_CONFIG.FILES_BUCKET,
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

  /**
   * Constructs storage path of file by mapping value provided for author's username to a Cognito Identity Id
   *
   *
   * @private
   * @param {string} authorUsername [The Learning Object's author's username]
   * @param {string} learningObjectId [The id of the Learning Object to upload file to]
   * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
   * @param {string} path [The path of the object]
   *
   * @returns {Promise<string>}
   * @memberof S3FileManager
   */
  private async generateObjectPath({
    authorUsername,
    learningObjectId,
    learningObjectRevisionId,
    path,
  }: {
    authorUsername: string;
    learningObjectId: string;
    learningObjectRevisionId: number;
    path: string;
  }): Promise<string> {
    try {
      const cognitoId: string = await FileAccessIdentitiesAdapter.getInstance().getFileAccessIdentity(
        authorUsername,
      );
      console.log(
        `${cognitoId}/${learningObjectId}/${learningObjectRevisionId}/${path}`,
      );
      return `${cognitoId}/${learningObjectId}/${learningObjectRevisionId}/${path}`;
    } catch (err) {
      reportError(err);
    }
  }
}
