import { FileManager } from '../interfaces/interfaces';
import * as AWS from 'aws-sdk';
import { AWS_SDK_CONFIG } from '../config/aws-sdk.config';
import {
  FileUpload,
  MultipartFileUpload,
  MultipartUploadData,
  CompletedPartList,
} from '../interfaces/FileManager';

AWS.config.credentials = AWS_SDK_CONFIG.credentials;

const AWS_S3_BUCKET = 'neutrino-file-uploads';
const AWS_S3_ACL = 'public-read';

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

  /**
   * Processes Chunk uploads
   * If there is trouble with the upload AWS auto aborts multipart upload
   * @param {{
   *     file: MultipartFileUpload;
   *     finish?: boolean;
   *     completedPartList?: CompletedPartList;
   *   }} params
   * @returns {Promise<MultipartUploadData>}
   * @memberof S3Driver
   */
  public async processMultipart(params: {
    file: MultipartFileUpload;
    finish?: boolean;
    completedPartList?: CompletedPartList;
  }): Promise<MultipartUploadData> {
    try {
      // If uploadId doesn't exist, a multipart upload has not been created for file upload
      if (!params.file.uploadId) {
        const createParams = {
          Bucket: AWS_S3_BUCKET,
          ACL: AWS_S3_ACL,
          Key: params.file.path,
        };
        // Create multipart file upload
        const createdUpload = await this.s3
          .createMultipartUpload(createParams)
          .promise();
        params.file.uploadId = createdUpload.UploadId;
      }
      const partUploadParams = {
        Bucket: AWS_S3_BUCKET,
        Key: params.file.path,
        Body: params.file.data,
        PartNumber: params.file.partNumber,
        UploadId: params.file.uploadId,
      };
      // Upload chunk
      const uploadData = await this.s3.uploadPart(partUploadParams).promise();

      // If last chunk is being uploaded, finalize multipart upload
      if (params.finish) {
        const completedParams = {
          Bucket: AWS_S3_BUCKET,
          Key: params.file.path,
          UploadId: params.file.uploadId,
          MultipartUpload: {
            Parts: params.completedPartList,
          },
        };
        // Finalize upload
        const completedUploadData = await this.s3
          .completeMultipartUpload(completedParams)
          .promise();
        return { url: completedUploadData.Location };
      }

      return {
        uploadId: params.file.uploadId,
        completedPart: {
          ETag: uploadData.ETag,
          PartNumber: params.file.partNumber,
        },
      };
    } catch (e) {
      return Promise.reject(e);
    }
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
  async cancelMultipart(params: {
    path: string;
    uploadId: string;
  }): Promise<void> {
    try {
      const abortUploadParams = {
        Bucket: AWS_S3_BUCKET,
        Key: params.path,
        UploadId: params.uploadId,
      };
      await this.s3.abortMultipartUpload(abortUploadParams).promise();
      return Promise.resolve();
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
    try {
      const listParams = {
        Bucket: AWS_S3_BUCKET,
        Prefix: params.path,
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
        return await this.deleteAll(params);
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
