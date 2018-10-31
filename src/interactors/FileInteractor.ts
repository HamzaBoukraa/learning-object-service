import { DataStore } from '../interfaces/DataStore';
import { FileManager } from '../interfaces/interfaces';
import { Readable } from 'stream';
import { LearningObjectFile } from './LearningObjectInteractor';

export class FileInteractor {
  static async streamFile(params: {
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
}

export function getMimeType(params: { file: LearningObjectFile }): string {
  return params.file.fileType;
}
