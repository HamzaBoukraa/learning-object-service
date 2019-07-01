import { FileManagerModule as Module } from '.';
import { DataStore } from '../shared/interfaces/DataStore';

import { FileManager } from '../shared/interfaces/interfaces';
import { LearningObject } from '../shared/entity';
import { Readable } from 'stream';
import { MultipartFileUploadStatus, DZFile, FileUpload } from './typings/file-manager';
import { ResourceError, ResourceErrorReason } from '../shared/errors';

namespace Drivers {
  export const fileManager = () => Module.resolveDependency(FileManager);
}

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
  objectId: string;
  filePath: string;
  user: any;
  username?: string;
}): Promise<string> {
  const path = `${params.username || params.user.username}/${
    params.objectId
  }/${params.filePath}`;
  const uploadId = await Drivers.fileManager().initMultipartUpload({ path });
  const status: MultipartFileUploadStatus = {
    path,
    _id: uploadId,
    completedParts: [],
    createdAt: Date.now().toString(),
  };
  await params.dataStore.insertMultipartUploadStatus({ status });
  return uploadId;
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
  file: DZFile;
  fileUpload: FileUpload;
  uploadId: string;
}): Promise<void> {
  const partNumber = +params.file.dzchunkindex + 1;
  const completedPart = await Drivers.fileManager().uploadPart({
    path: params.fileUpload.path,
    data: params.fileUpload.data,
    partNumber,
    uploadId: params.uploadId,
  });
  await params.dataStore.updateMultipartUploadStatus({
    completedPart,
    id: params.uploadId,
  });
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
  uploadId: string;
}): Promise<string> {
  const uploadStatus = await params.dataStore.fetchMultipartUploadStatus({
    id: params.uploadId,
  });
  params.dataStore.deleteMultipartUploadStatus({ id: params.uploadId });
  const url = await Drivers.fileManager().completeMultipartUpload({
    path: uploadStatus.path,
    uploadId: params.uploadId,
    completedPartList: uploadStatus.completedParts,
  });
  return url;
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
  uploadId: string;
}): Promise<void> {
  const uploadStatus = await params.dataStore.fetchMultipartUploadStatus({
    id: params.uploadId,
  });
  params.dataStore.deleteMultipartUploadStatus({ id: params.uploadId });
  await Drivers.fileManager().abortMultipartUpload({
    path: uploadStatus.path,
    uploadId: params.uploadId,
  });
}

/**
 * Instructs file manager to upload a single file
 *
 * @export
 * @param {{ FileManager }} fileManager
 * @param {{ FileUpload }} file
 * @returns {string}
 */
export async function uploadFile(params: {
  file: FileUpload,
}): Promise<void> {
  await Drivers.fileManager().upload({
    file: params.file,
  });
}

/**
 * Instructs file manager to delete  a single file
 *
 * @export
 * @param {{ FileManager }} fileManager
 * @param {{ FileUpload }} file
 * @returns {string}
 */
export async function deleteFile(params: {
  path: string;
}): Promise<void> {
  await Drivers.fileManager().delete({
    path: params.path,
  });
}

export async function deleteFolder(params: {
  path: string;
}): Promise<void> {
  await Drivers.fileManager().deleteFolder({
    path: params.path,
  });
}

/**
 * Sends a file back to the caller as a readable stream.
 *
 * @param params.learningObjectId the identifier of the Learning Object that the file belongs to
 * @param params.fileId the identifier of the file to be downloaded
 * @param params.dataStore the gateway for data operations
 * @param params.fileManager the gateway for file operations
 * @param params.author the username of the Learning Object's author
 *
 * @returns a Promise with the filename, mimeType, and readable stream of file data.
 */
export async function downloadSingleFile(params: {
  learningObjectId: string;
  fileId: string;
  dataStore: DataStore;
  author: string;
}): Promise<{ filename: string; mimeType: string; stream: Readable }> {
  let learningObject, fileMetaData;

  learningObject = await params.dataStore.fetchLearningObject({
    id: params.learningObjectId,
    full: true,
  });

  if (!learningObject) {
    throw new ResourceError(
      `Learning object ${params.learningObjectId} does not exist.`,
      ResourceErrorReason.NOT_FOUND,
    );
  }

  // Collect requested file metadata from datastore
  fileMetaData = await params.dataStore.findSingleFile({
    learningObjectId: params.learningObjectId,
    fileId: params.fileId,
  });

  if (!fileMetaData) {
    return Promise.reject({
      object: learningObject,
      message: `File not found`,
    });
  }

  const path = `${params.author}/${params.learningObjectId}/${
    fileMetaData.fullPath ? fileMetaData.fullPath : fileMetaData.name
  }`;
  const mimeType = fileMetaData.fileType;
  // Check if the file manager has access to the resource before opening a stream
  if (await Drivers.fileManager().hasAccess(path)) {
    const stream = Drivers.fileManager().streamWorkingCopyFile({ path });
    return { mimeType, stream, filename: fileMetaData.name };
  } else {
    throw Error(`File not found ${learningObject.name}`);
  }
}
/**
 * Gets file type
 *
 * @export
 * @param {{ file: LearningObject.Material.File }} params
 * @returns {string}
 */
export function getMimeType(params: {
  file: LearningObject.Material.File;
}): string {
  return params.file.fileType;
}

