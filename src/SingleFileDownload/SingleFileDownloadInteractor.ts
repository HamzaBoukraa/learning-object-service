import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/FileManager';
import { Readable } from 'stream';

export async function downloadSingleFile(params: {
  learningObjectId: string;
  fileId: string;
  dataStore: DataStore;
  fileManager: FileManager;
  author: string;
}): Promise<{ filename: string; mimeType: string; stream: Readable }> {
  let learningObject, fileMetaData;

  learningObject = await params.dataStore.fetchLearningObject(
    params.learningObjectId,
  );

  if (!learningObject) {
    throw new Error(
      `Learning object ${params.learningObjectId} does not exist.`,
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
  if (await params.fileManager.hasAccess(path)) {
    const stream = params.fileManager.streamFile({ path });
    return { mimeType, stream, filename: fileMetaData.name };
  } else {
    throw { message: 'File not found', object: { name: learningObject.name } };
  }
}
