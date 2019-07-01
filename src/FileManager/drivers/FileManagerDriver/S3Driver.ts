import 'dotenv/config';
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { Readable } from 'stream';
import { reportError } from '../../../shared/SentryConnector';
import { FileManager } from '../../../shared/interfaces/interfaces';
import { AWS_SDK_CONFIG } from '../../config/aws-sdk.config';
import { CompletedPartList, CompletedPart } from '../../typings/file-manager';

AWS.config.credentials = AWS_SDK_CONFIG.credentials;

const BUCKETS = {
  WORKING_FILES: process.env.WORKING_FILES_BUCKET,
  RELEASED_FILES: process.env.RELEASED_FILES_BUCKET,
};

export class S3Driver implements FileManager {
  private s3 = new AWS.S3({ region: AWS_SDK_CONFIG.region });

  /**
   * Returns stream of file from working files bucket
   *
   * @param {{ path: string }} params
   * @returns {Readable}
   * @memberof S3Driver
   */
  streamWorkingCopyFile(params: { path: string }): Readable {
    const { path } = params;
    return this.streamFile({ path, bucket: BUCKETS.WORKING_FILES });
  }

  async copyToReleased(params: {
    srcFolder: string;
    destFolder: string;
  }): Promise<void> {
    const { srcFolder, destFolder } = params;
    const files = await this.listFiles({
      bucket: BUCKETS.WORKING_FILES,
      path: srcFolder,
    });
    await Promise.all(
      files.map(file => {
        const uploadPath = file.Key.replace(srcFolder, destFolder);
        return this.copyObjectToBucket({
          srcBucket: BUCKETS.WORKING_FILES,
          srcPath: file.Key,
          destBucket: BUCKETS.RELEASED_FILES,
          destPath: uploadPath,
        });
      }),
    );
  }

  /**
   * Copies an object from one bucket to another
   *
   * @private
   * @param {{
   *     destBucket: string;
   *     srcBucket: string;
   *     srcPath: string;
   *     destPath: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  private async copyObjectToBucket(params: {
    destBucket: string;
    srcBucket: string;
    srcPath: string;
    destPath: string;
  }): Promise<void> {
    const { destBucket, srcBucket, srcPath, destPath } = params;
    const copyParams = {
      Bucket: destBucket,
      CopySource: encodeURIComponent(`${srcBucket}/${srcPath}`),
      Key: destPath,
    };
    await this.s3.copyObject(copyParams).promise();
  }

  /**
   * Returns a list of files at specified path in bucket
   *
   * @private
   * @param {{
   *     bucket: string;
   *     path: string;
   *     files?: AWS.S3.Object[];
   *   }} params
   * @returns {Promise<AWS.S3.Object[]>}
   * @memberof S3Driver
   */
  private async listFiles(params: {
    bucket: string;
    path: string;
    files?: AWS.S3.Object[];
  }): Promise<AWS.S3.Object[]> {
    let { bucket, path, files } = params;
    if (!files) {
      files = [];
    }
    const listParams = {
      Bucket: bucket,
      Prefix: path,
    };
    const objects = await this.s3.listObjectsV2(listParams).promise();
    if (objects.IsTruncated) {
      return this.listFiles({
        path,
        bucket,
        files: objects.Contents,
      });
    }
    files = [...files, ...objects.Contents];
    return files;
  }

  async upload(params: { file: FileUpload }): Promise<string> {
    const uploadParams = {
      Bucket: BUCKETS.WORKING_FILES,
      Key: params.file.path,
      Body: params.file.data,
    };
    const response = await this.s3.upload(uploadParams).promise();
    return response.Location;
  }

  async initMultipartUpload(params: { path: string }): Promise<string> {
    const createParams = {
      Bucket: BUCKETS.WORKING_FILES,
      Key: params.path,
    };
    const createdUpload = await this.s3
      .createMultipartUpload(createParams)
      .promise();
    return createdUpload.UploadId;
  }

  async uploadPart(params: {
    path: string;
    data: any;
    partNumber: number;
    uploadId: string;
  }): Promise<CompletedPart> {
    const partUploadParams = {
      Bucket: BUCKETS.WORKING_FILES,
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

  async completeMultipartUpload(params: {
    path: string;
    uploadId: string;
    completedPartList: CompletedPartList;
  }): Promise<string> {
    params.completedPartList.sort(
      (partA, partB) => partA.PartNumber - partB.PartNumber,
    );
    const completedParams = {
      Bucket: BUCKETS.WORKING_FILES,
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

  async abortMultipartUpload(params: {
    path: string;
    uploadId: string;
  }): Promise<void> {
    const abortUploadParams = {
      Bucket: BUCKETS.WORKING_FILES,
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
  async delete(params: { path: string }): Promise<void> {
    const deleteParams = {
      Bucket: BUCKETS.WORKING_FILES,
      Key: params.path,
    };
    return await this.deleteObject(deleteParams);
  }

  /**
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
   * @param {string} path
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  async deleteFolder(params: { path: string}): Promise<void> {
    if (params.path[params.path.length] !== '/') {
      throw Error('Path to delete a folder must end with a /');
    }
    const listObjectsParams = {
      Bucket: BUCKETS.WORKING_FILES,
      Key: params.path,
    };
    const listedObjects = await this.s3.listObjectsV2(listObjectsParams).promise();
    if (listedObjects.Contents.length === 0) return;
    const deleteObjectsParams = {
      Bucket: BUCKETS.WORKING_FILES,
      Delete: { Objects: <any>[] },
    };

    listedObjects.Contents.forEach(({Key}) => {
      deleteObjectsParams.Delete.Objects.push({Key});
    });

    await this.s3.deleteObjects(deleteObjectsParams).promise();

    if (listedObjects.IsTruncated) await this.deleteFolder({path: params.path});
  }

  async deleteAll(params: { path: string }): Promise<void> {
    const listParams = {
      Bucket: BUCKETS.WORKING_FILES,
      Prefix: params.path,
    };

    const listedObjects = await this.s3.listObjectsV2(listParams).promise();
    if (listedObjects.Contents && listedObjects.Contents.length) {
      const deleteParams = {
        Bucket: BUCKETS.WORKING_FILES,
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

  streamFile(params: { path: string; bucket?: string }): Readable {
    const { path, bucket } = params;
    const fetchParams = {
      Bucket: bucket || BUCKETS.RELEASED_FILES,
      Key: path,
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
    await this.s3.deleteObject(params).promise();
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
      Bucket: BUCKETS.WORKING_FILES,
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
