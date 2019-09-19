import {
    FileMetadataDocument,
    LearningObjectFile,
  } from '../../../typings';
import { getFilePreviewURL } from '../../getFilePreviewURL/getFilePreviewURL';

/**
 * Transforms file metadata document into LearningObjectFile
 *
 * @param {FileMetadataDocument} file [File metadata to use to create LearningObjectFile]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} authorUsername [Username of the LearningObject's author the file meta belongs to]
 * @returns {LearningObjectFile}
 */
export function transformFileMetadataToLearningObjectFile({
    authorUsername,
    learningObjectId,
    file,
  }: {
    authorUsername: string;
    learningObjectId: string;
    file: FileMetadataDocument;
  }): LearningObjectFile {
    return {
      id: file.id,
      name: file.name,
      fileType: file.mimeType,
      extension: file.extension,
      previewUrl: getFilePreviewURL({
        authorUsername,
        learningObjectId,
        fileId: file.id,
        extension: file.extension,
        unreleased: true,
      }),
      date: file.lastUpdatedDate,
      fullPath: file.fullPath,
      size: file.size,
      description: file.description,
      packageable: file.packageable,
      storageRevision: file.storageRevision,
    };
}
