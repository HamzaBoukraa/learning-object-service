import { FileManager } from '../interfaces/interfaces';
import * as AWS from 'aws-sdk';
import { AWS_SDK_CONFIG } from '../config/aws-sdk.config';
AWS.config.credentials = AWS_SDK_CONFIG.credentials;

const AWS_S3_BUCKET = 'neutrino-file-uploads';
const AWS_S3_ACL = 'public-read';

export class S3Driver implements FileManager {
  private s3 = new AWS.S3({ region: AWS_SDK_CONFIG.region });

  public async upload(path: string, file: any): Promise<string> {
    try {
      const params = {
        Bucket: AWS_S3_BUCKET,
        Key: path,
        ACL: AWS_S3_ACL,
        Body: file,
      };
      const response = await this.s3.upload(params).promise();
      return response.Location;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Deletes Specified file from storage
   *
   * @param {string} path
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  public async delete(path: string): Promise<void> {
    try {
      const params = {
        Bucket: AWS_S3_BUCKET,
        Key: path,
      };
      return await this.deleteObject(params);
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
  public async deleteAll(path: string): Promise<void> {
    try {
      const listParams = {
        Bucket: AWS_S3_BUCKET,
        Prefix: path,
      };

      const listedObjects = await this.s3.listObjectsV2(listParams).promise();

      const deleteParams = {
        Bucket: AWS_S3_BUCKET,
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
        },
      };

      await this.s3.deleteObjects(deleteParams).promise();

      if (listedObjects.IsTruncated) {
        return await this.deleteAll(path);
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
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
}
