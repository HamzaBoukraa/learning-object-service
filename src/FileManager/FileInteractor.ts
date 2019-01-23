import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';
import { Readable } from 'stream';
import { LearningObjectFile } from '../interactors/LearningObjectInteractor';
import { MultipartFileUploadStatus, DZFile, FileUpload } from '../interfaces/FileManager';

/**
 * Creates multipart upload and saves metadata for upload
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   fileManager: FileManager;
 *   objectId: string;
 *   filePath: string;
 *   user: any;
 * }} params
 * @returns {Promise<string>}
 */
export async function startMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  objectId: string;
  filePath: string;
  user: any;
}): Promise<string> {
  try {
    const path = `${params.user.username}/${params.objectId}/${
      params.filePath
      }`;
    const uploadId = await params.fileManager.initMultipartUpload({ path });
    const status: MultipartFileUploadStatus = {
      path,
      _id: uploadId,
      completedParts: [],
      createdAt: Date.now().toString(),
    };
    await params.dataStore.insertMultipartUploadStatus({ status });
    return uploadId;
  } catch (e) {
    console.error(e);
    throw `Could not start upload.`;
  }
}

/**
 * Processes Multipart Uploads
 *
 * @private
 * @static
 * @param {{
 *     dataStore: DataStore;
 *     fileManager: FileManager;
 *     file: DZFile;
 *     fileUpload: FileUpload;
 *   }} params
 */
export async function processMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  file: DZFile;
  fileUpload: FileUpload;
  uploadId: string;
}): Promise<LearningObjectFile> {
  try {
    const partNumber = +params.file.dzchunkindex + 1;
    const completedPart = await params.fileManager.uploadPart({
      path: params.fileUpload.path,
      data: params.fileUpload.data,
      partNumber,
      uploadId: params.uploadId,
    });
    await params.dataStore.updateMultipartUploadStatus({
      completedPart,
      id: params.uploadId,
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Finalizes multipart upload and returns file url;
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   fileManager: FileManager;
 *   fileId: string;
 * }} params
 * @returns {Promise<string>}
 */
export async function finalizeMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  uploadId: string;
}): Promise<string> {
  try {
    const uploadStatus = await params.dataStore.fetchMultipartUploadStatus({
      id: params.uploadId,
    });
    params.dataStore.deleteMultipartUploadStatus({ id: params.uploadId });
    const url = await params.fileManager.completeMultipartUpload({
      path: uploadStatus.path,
      uploadId: params.uploadId,
      completedPartList: uploadStatus.completedParts,
    });
    return url;
  } catch (e) {
    console.error(e);
    throw `Could not complete upload`;
  }
}

/**
 * Aborts multipart upload
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   fileManager: FileManager;
 *   uploadId: string;
 * }} params
 * @returns {Promise<void>}
 */
export async function abortMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  uploadId: string;
}): Promise<void> {
  try {
    const uploadStatus = await params.dataStore.fetchMultipartUploadStatus({
      id: params.uploadId,
    });
    params.dataStore.deleteMultipartUploadStatus({ id: params.uploadId });
    await params.fileManager.abortMultipartUpload({
      path: uploadStatus.path,
      uploadId: params.uploadId,
    });
  } catch (e) {
    console.error(e);
    throw new Error(`Could not cancel upload`);
  }
}

/**
 * Gets file type
 *
 * @export
 * @param {{ file: LearningObjectFile }} params
 * @returns {string}
 */
export function getMimeType(params: { file: LearningObjectFile }): string {
  return params.file.fileType;
}
