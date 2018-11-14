import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';
import { Readable } from 'stream';
import { LearningObjectFile } from '../interactors/LearningObjectInteractor';
import {
  MultipartFileUploadStatus,
  DZFile,
  FileUpload,
  CompletedPartList,
} from '../interfaces/FileManager';
import { InMemoryStore } from '../interfaces/InMemoryStore';

const MULTIPART_EXPIRATION = +process.env.MULTIPART_EXPIRATION;
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
  inMemoryStore: InMemoryStore;
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
      uploadId,
      path,
      createdAt: Date.now().toString(),
    };
    await params.inMemoryStore.set({
      key: params.fileId,
      value: status,
      expiration: MULTIPART_EXPIRATION,
    });
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
 * @returns {Promise<void>}
 */
export async function processMultipartUpload(params: {
  inMemoryStore: InMemoryStore;
  fileManager: FileManager;
  file: DZFile;
  fileUpload: FileUpload;
}): Promise<void> {
  try {
    const partNumber = +params.file.dzchunkindex + 1;
    // Fetch Upload Status
    const uploadStatus: MultipartFileUploadStatus = await params.inMemoryStore.get(
      {
        key: params.file.dzuuid,
      },
    );
    const completedPart = await params.fileManager.uploadPart({
      path: uploadStatus.path,
      data: params.fileUpload.data,
      partNumber,
      uploadId: uploadStatus.uploadId,
    });
    await params.inMemoryStore.set({
      key: `${params.file.dzuuid}-${partNumber}`,
      value: {
        completedPart,
        createdAt: Date.now(),
      },
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
  inMemoryStore: InMemoryStore;
  fileManager: FileManager;
  fileId: string;
  totalParts: number;
}): Promise<string> {
  try {
    const uploadStatus = await params.inMemoryStore.get({
      key: params.fileId,
    });
    params.inMemoryStore.remove({ key: params.fileId });
    const completedPartList: CompletedPartList = [];
    await Promise.all(
      Array(params.totalParts)
        .fill(1)
        .map(async (_, index) => {
          const completed = await params.inMemoryStore.get({
            key: `${params.fileId}-${index + 1}`,
          });
          params.inMemoryStore.remove({
            key: `${params.fileId}-${index + 1}`,
          });
          completedPartList.push(completed.completedPart);
        }),
    );

    const url = await params.fileManager.completeMultipartUpload({
      path: uploadStatus.path,
      uploadId: uploadStatus.uploadId,
      completedPartList,
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
  inMemoryStore: InMemoryStore;
  fileManager: FileManager;
  fileId: string;
  totalParts: number;
}): Promise<void> {
  try {
    const uploadStatus = await params.inMemoryStore.get({
      key: params.fileId,
    });
    params.inMemoryStore.remove({ key: params.fileId });
    Array(params.totalParts)
      .fill(1)
      .map(async (_, index) =>
        params.inMemoryStore.remove({
          key: `${params.fileId}-${index + 1}`,
        }),
      );
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
