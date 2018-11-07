import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';
import { Readable } from 'stream';
import { LearningObjectFile } from '../interactors/LearningObjectInteractor';
import { MultipartFileUploadStatus } from '../interfaces/FileManager';

export async function startMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  objectId: string;
  fileId: string;
  filePath: string;
  user: any;
}): Promise<string> {
  const path = `${params.user.username}/${params.objectId}/${params.filePath}`;
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
}

export async function finalizeMultipartUpload(params: {
  dataStore: DataStore;
  fileManager: FileManager;
  fileId: string;
}): Promise<string> {
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
}

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

export function getMimeType(params: { file: LearningObjectFile }): string {
  return params.file.fileType;
}
