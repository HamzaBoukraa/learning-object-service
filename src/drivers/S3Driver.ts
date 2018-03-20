import { FileManager } from '../interfaces/interfaces';
import * as AWS from 'aws-sdk';
import { AWS_SDK_CONFIG } from '../config/aws-sdk.config';
import { LearningObjectFile } from '../interfaces/FileManager';
AWS.config.credentials = AWS_SDK_CONFIG.credentials;

const AWS_S3_BUCKET = 'neutrino-file-uploads';
const AWS_S3_ACL = 'public-read';

export class S3Driver implements FileManager {
  private s3 = new AWS.S3({ region: AWS_SDK_CONFIG.region });
  /**
   * Uploads files to S3
   *
   * @param {string} id
   * @param {string} username
   * @param {any[]} files
   * @returns {Promise<LearningObjectFile[]>}
   * @memberof S3Driver
   */
  public async upload(
    id: string,
    username: string,
    files: any[]
  ): Promise<LearningObjectFile[]> {
    try {
      let learningObjectFiles: LearningObjectFile[] = [];
      for (let file of files) {
        let loFile = this.generateLearningObjectFile(file);

        let params = {
          Bucket: AWS_S3_BUCKET,
          Key: `${username}/${id}/${loFile.name}`,
          ACL: AWS_S3_ACL,
          Body: file.buffer
        };

        let response = await this.s3.upload(params).promise();
        loFile.url = response.Location;
        learningObjectFiles.push(loFile);
      }

      return learningObjectFiles;
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Deletes Specified file from storage
   *
   * @param {string} id
   * @param {string} username
   * @param {string} filename
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  public async delete(
    id: string,
    username: string,
    filename: string
  ): Promise<void> {
    try {
      let params = {
        Bucket: AWS_S3_BUCKET,
        Key: `${username}/${id}/${filename}`
      };
      await this.deleteObject(params);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Deletes all files in storage
   *
   * @param {string} id
   * @param {string} username
   * @returns {Promise<void>}
   * @memberof S3Driver
   */
  public async deleteAll(id: string, username: string): Promise<void> {
    try {
      const listParams = {
        Bucket: AWS_S3_BUCKET,
        Prefix: `${username}/${id}/`
      };

      const listedObjects = await this.s3.listObjectsV2(listParams).promise();
      let deleteParams = {
        Bucket: AWS_S3_BUCKET,
        Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) }
      };
      await this.s3.deleteObjects(deleteParams).promise();

      if (listedObjects.IsTruncated) await this.deleteAll(id, username);
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
      await this.s3.deleteObject().promise();
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * Generates new LearningObjectFile Object
   *
   * @private
   * @param {any} file
   * @returns
   * @memberof S3Driver
   */
  private generateLearningObjectFile(file: any): LearningObjectFile {
    let name_id = file.originalname.split(/!@!/g);
    let originalname = name_id[0];
    let description = +name_id[1];
    let fileType = file.mimetype;
    let extension = originalname.match(/([A-Za-z]{1,})$/)[0];
    let date = Date.now().toString();

    let learningObjectFile: LearningObjectFile = {
      name: originalname,
      fileType: fileType,
      extension: extension,
      url: null,
      date: date,
      description: description
    };

    return learningObjectFile;
  }
}
