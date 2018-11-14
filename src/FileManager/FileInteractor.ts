import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';
import { Readable } from 'stream';
import { LearningObjectFile } from '../interactors/LearningObjectInteractor';
import { MultipartFileUploadStatus } from '../interfaces/FileManager';

/**
 * Creates multipart upload and saves metadata for upload
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   fileManager: FileManager;
 *   objectId: string;
 *   fileId: string;
 *   filePath: string;
 *   user: any;
 * }} params
 * @returns {Promise<string>}
 */
export async function startMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  objectId: string;
  fileId: string;
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
      uploadId,
      _id: params.fileId,
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
  fileId: string;
}): Promise<string> {
  try {
    const uploadStatus = await params.dataStore.fetchMultipartUploadStatus({
      id: params.fileId,
    });
    params.dataStore.deleteMultipartUploadStatus({ id: params.fileId });
    const url = await params.fileManager.completeMultipartUpload({
      path: uploadStatus.path,
      uploadId: uploadStatus.uploadId,
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
 *   fileId: string;
 * }} params
 * @returns {Promise<void>}
 */
export async function abortMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  fileId: string;
}): Promise<void> {
  try {
    const uploadStatus = await params.dataStore.fetchMultipartUploadStatus({
      id: params.fileId,
    });
    params.dataStore.deleteMultipartUploadStatus({ id: params.fileId });
    await params.fileManager.abortMultipartUpload({
      path: uploadStatus.path,
      uploadId: uploadStatus.uploadId,
    });
  } catch (e) {
    console.error(e);
    throw `Could not cancel upload`;
  }
}

/**
 * Fetches file stream
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   fileManager: FileManager;
 *   username: string;
 *   learningObjectId: string;
 *   fileId: string;
 * }} params
 * @returns {Promise<{ filename: string; mimeType: string; stream: Readable }>}
 */
export async function streamFile(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  username: string;
  learningObjectId: string;
  fileId: string;
}): Promise<{ filename: string; mimeType: string; stream: Readable }> {
  try {
    const file = await params.dataStore.findSingleFile({
      learningObjectId: params.learningObjectId,
      fileId: params.fileId,
    });
    const path = `${params.username}/${params.learningObjectId}/${
      file.fullPath ? file.fullPath : file.name
    }`;
    const mimeType = getMimeType({ file });
    const stream = params.fileManager.streamFile({ path });
    return { mimeType, stream, filename: file.name };
  } catch (e) {
    return Promise.reject(e);
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
