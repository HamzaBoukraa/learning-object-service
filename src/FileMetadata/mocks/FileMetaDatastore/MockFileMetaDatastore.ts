import { FileMetaDatastore } from '../../interfaces';
import {
  FileMetadataDocument,
  FileMetadataInsert,
  FileMetadataUpdate,
} from '../../typings';
import { Stubs } from '../../../tests/stubs';

export class MockFileMetaDatastore implements FileMetaDatastore {
  private stubs = new Stubs();

  private fileMeta = {
    ...this.stubs.learningObjectFile,
    createdDate: Date.now().toString(),
    description:
      this.stubs.learningObjectFile.description || 'some description',
    lastUpdatedDate: Date.now().toString(),
    learningObjectId: this.stubs.learningObject.id,
    storageRevision: this.stubs.learningObject.revision,
    mimeType: this.stubs.learningObjectFile.fileType,
    ETag: 'somerandomstring',
    packageable: true,
    fullPath:
      this.stubs.learningObjectFile.fullPath ||
      this.stubs.learningObjectFile.name,
    size: this.stubs.learningObjectFile.size || 100,
  };
  findFileMetadata(params: {
    learningObjectId: string;
    fullPath: string;
  }): Promise<FileMetadataDocument> {
    return Promise.resolve(this.fileMeta);
  }
  fetchFileMeta(id: string): Promise<FileMetadataDocument> {
    return Promise.resolve(this.fileMeta);
  }
  fetchAllFileMeta(learningObjectId: string): Promise<FileMetadataDocument[]> {
    return Promise.resolve([this.fileMeta]);
  }
  insertFileMeta(fileMeta: FileMetadataInsert): Promise<FileMetadataDocument> {
    return Promise.resolve(this.fileMeta);
  }
  updateFileMeta(params: {
    id: string;
    updates: FileMetadataUpdate;
  }): Promise<void> {
    return Promise.resolve();
  }
  deleteFileMeta(id: string): Promise<void> {
    return Promise.resolve();
  }
  deleteAllFileMeta(learningObjectId: string): Promise<void> {
    return Promise.resolve();
  }
}
