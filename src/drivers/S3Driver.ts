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
    files: any[],
    filePathMap: Map<string, string>
  ): Promise<LearningObjectFile[]> {
    try {
      let learningObjectFiles: LearningObjectFile[] = [];
      for (let file of files) {
        let loFile = this.generateLearningObjectFile(file);
        const parent = filePathMap.get(loFile.id);
        const path = this.getFullPath(filePathMap, loFile);
        let params = {
          Bucket: AWS_S3_BUCKET,
          Key: `${username}/${id}/${path}`,
          ACL: AWS_S3_ACL,
          Body: file.buffer.length ? file.buffer : Buffer.from(file.buffer)
        };
        let response = await this.s3.upload(params).promise();
        loFile.url = response.Location;
        if (parent) {
          loFile.fullPath = path;
        }
        learningObjectFiles.push(loFile);
      }
      return learningObjectFiles;
    } catch (e) {
      console.log(e);
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
        Delete: {
          Objects: listedObjects.Contents.map(({ Key }) => ({ Key }))
        }
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
      await this.s3.deleteObject(params).promise();
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
    let id = name_id[1];
    let fileType = file.mimetype;
    let extMatch = originalname.match(/(\.[^.]*$|$)/);
    let extension = extMatch ? extMatch[0] : '';
    let date = Date.now().toString();

    let learningObjectFile: LearningObjectFile = {
      id: id,
      name: originalname,
      fileType: fileType,
      extension: extension,
      url: null,
      date: date
    };

    return learningObjectFile;
  }
  /**
   * Gets file's full path
   *
   * @private
   * @param {Map<string, string>} filePathMap
   * @param {LearningObjectFile} file
   * @returns
   * @memberof S3Driver
   */
  private getFullPath(
    filePathMap: Map<string, string>,
    file: LearningObjectFile
  ) {
    let folderName = filePathMap.get(file.id);
    if (!folderName) return file.name;
    let path = `${folderName}/${file.name}`;
    return path;
  }
}
