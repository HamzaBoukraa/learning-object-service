import {
    Requester,
    FileMetadata,
    LearningObjectFile,
    LearningObjectSummary,
    FileMetadataInsert,
    FileMetadataDocument,
} from '../../typings';
import { Drivers, Gateways } from '../shared/resolvedDependencies';
import { getFilePreviewURL } from '../getFilePreviewURL/getFilePreviewURL';
import { authorizeWriteAccess } from '../../../shared/AuthorizationManager';
import { toNumber, sanitizeObject } from '../../../shared/functions';
import * as mime from 'mime-types';
import { validateRequestParams } from '../shared/validateRequestParams/validateRequestParams';
import * as Validators from '../shared/validators';
import { handleError, ResourceError, ResourceErrorReason } from '../../../shared/errors';
const DEFAULT_MIME_TYPE = 'application/octet-stream';

/**
 * Adds FileMetadataDocuments
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {FileMetadata[]} files [The file metadata to be added to the Learning Object]
 *
 * @returns {Promise<string[]>}
 */
export async function addFileMetadata({
    requester,
    learningObjectId,
    files,
  }: {
    requester: Requester;
    learningObjectId: string;
    files: FileMetadata[];
  }): Promise<LearningObjectFile[]> {
  try {
    validateRequestParams({
      operation: 'Add file metadata',
      values: [
        {
          value: learningObjectId,
          validator: Validators.stringHasContent,
          propertyName: 'Learning Object id',
        },
        {
          value: files,
          validator: Validators.valueDefined,
          propertyName: 'File metadata',
        },
      ],
    });
    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
      { requester, id: learningObjectId },
    );

    authorizeWriteAccess({ learningObject, requester });

    const inserts: FileMetadataInsert[] = generateFileMetadataInserts(
      files,
      learningObject,
    );

    const insertedFiles = await Promise.all(
      inserts.map(handleFileMetadataInsert(learningObject)),
    );
    Gateways.learningObjectGateway().updateObjectLastModifiedDate(
      learningObjectId,
    );
    return insertedFiles;
  } catch (e) {
    handleError(e);
  }
}

/**
 * Generates array of FileMetadataInserts
 *
 * Input data is validated to make sure all required fields are defined and have valid values
 * Input data is also sanitized to remove undefined values and trim strings
 *
 * @param {FileMetadata[]} files [The array of file metadata to generate inserts for]
 * @param {LearningObjectSummary} learningObject [Information about the Learning Object the files belong to]
 * @returns {FileMetadataInsert[]}
 */
function generateFileMetadataInserts(
    files: FileMetadata[],
    learningObject: LearningObjectSummary,
  ): FileMetadataInsert[] {
    const inserts: FileMetadataInsert[] = [];
    for (const file of files) {
      const cleanFile = sanitizeObject({ object: file }, false);
      validateFileMeta(cleanFile);
      const newInsert: FileMetadataInsert = generateFileMetaInsert(
        cleanFile,
        learningObject,
      );
      inserts.push(newInsert);
    }
    return inserts;
}

/**
 * Validates required properties are defined and have valid values
 *
 * @param {FileMetadata} file [The file metadata to be validated]
 */
function validateFileMeta(file: FileMetadata) {
  const invalidInput = new ResourceError(
      '',
      ResourceErrorReason.BAD_REQUEST,
  );
  if (!Validators.stringHasContent(file.ETag)) {
    invalidInput.message = 'File metadata must contain a valid ETag.';
    throw invalidInput;
  }
  if (!Validators.stringHasContent(file.name)) {
    invalidInput.message = 'File metadata must contain a file name.';
    throw invalidInput;
  }
}

/**
 * Handles the insertion of FileMetadata
 *
 * Checks if file metadata trying to be added already exists
 * If file metadata already exists, the metadata for that file is updated
 * Otherwise the new file metadata is inserted
 *
 * @param {LearningObjectSummary} learningObject [Information about the Learning Object the files belong to]
 * @returns {(value: FileMetadataInsert) => Promise<LearningObjectFile>}
 */
function handleFileMetadataInsert(
    learningObject: LearningObjectSummary,
  ): (value: FileMetadataInsert) => Promise<LearningObjectFile> {
  return async insert => {
    const existingFile = await Drivers.datastore().findFileMetadata({
      learningObjectId: learningObject.id,
      fullPath: insert.fullPath,
    });
    if (existingFile) {
      delete insert.createdDate;
      await Drivers.datastore().updateFileMeta({
        id: existingFile.id,
        updates: insert,
      });
      return transformFileMetaToLearningObjectFile({
        authorUsername: learningObject.author.username,
        learningObjectId: learningObject.id,
        file: { ...existingFile, ...insert },
      });
    }
    return Drivers.datastore()
      .insertFileMeta(insert)
      .then(insertedFile =>
        transformFileMetaToLearningObjectFile({
          authorUsername: learningObject.author.username,
          learningObjectId: learningObject.id,
          file: insertedFile,
        }),
      );
  };
}

// 100 MB in bytes; File size is in bytes
const MAX_PACKAGEABLE_FILE_SIZE = 100000000;
/**
 * Checks if file is packageable by comparing it's size against the maximum packageable size
 *
 * @param {number} size
 * @returns
 */
function isPackageable(size: number) {
  return !(size > MAX_PACKAGEABLE_FILE_SIZE);
}

/**
 * Generates a single FileMetadataInsert
 *
 * @param {FileMetadata} file [The file metadata to generate insert for]
 * @param {LearningObjectSummary} learningObject [Information about the Learning Object the files belong to]
 * @returns {FileMetadataInsert}
 */
function generateFileMetaInsert(
    file: FileMetadata,
    learningObject: LearningObjectSummary,
  ): FileMetadataInsert {
  file.size = toNumber(file.size);
  const extension = file.name.split('.').pop();
  return {
    createdDate: Date.now().toString(),
    description: file.description || '',
    ETag: file.ETag,
    extension: `${extension ? '.' + extension : ''}`,
    fullPath: file.fullPath || file.name,
    lastUpdatedDate: Date.now().toString(),
    learningObjectId: learningObject.id,
    mimeType: file.mimeType || mime.lookup(extension) || DEFAULT_MIME_TYPE,
    name: file.name,
    packageable: isPackageable(file.size),
    size: file.size,
    storageRevision: learningObject.revision,
  };
}

/**
 * Transforms file metadata document into LearningObjectFile
 *
 * @param {FileMetadataDocument} file [File metadata to use to create LearningObjectFile]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} authorUsername [Username of the LearningObject's author the file meta belongs to]
 * @returns {LearningObjectFile}
 */
function transformFileMetaToLearningObjectFile({
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
