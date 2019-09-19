import { FileMetadataModule } from './FileMetadataModule';
import {
  FileMetaDatastore,
  LearningObjectGateway,
  FileManagerGateway,
} from './interfaces';
import {
  LearningObjectFile,
  Requester,
  FileMetadataUpdate,
  FileMetadata,
  FileMetadataDocument,
  LearningObjectSummary,
  FileMetadataInsert,
  FileMetadataFilter,
} from './typings';
import {
  ResourceError,
  ResourceErrorReason,
  handleError,
} from '../shared/errors';
import {
  authorizeWriteAccess,
  authorizeReadAccess,
} from '../shared/AuthorizationManager';
import { sanitizeObject, toNumber } from '../shared/functions';
import { reportError } from '../shared/SentryConnector';
import * as mime from 'mime-types';
import { LearningObject } from '../shared/entity';
import { validateRequestParams } from './shared/validateRequestParams/validateRequestParams';

const DEFAULT_MIME_TYPE = 'application/octet-stream';
const MICROSOFT_PREVIEW_URL = process.env.MICROSOFT_PREVIEW_URL;
const FILE_API_URI = process.env.LEARNING_OBJECT_API;

namespace Drivers {
  export const datastore = () =>
    FileMetadataModule.resolveDependency(FileMetaDatastore);
}

namespace Gateways {
  export const learningObjectGateway = () =>
    FileMetadataModule.resolveDependency(LearningObjectGateway);
  export const fileManager = () =>
    FileMetadataModule.resolveDependency(FileManagerGateway);
}

/**
 * Retrieves all file metadata that belongs to a Learning Object
 *
 * Allows file metadata to be filtered by released and unreleased
 *
 * If not filter specified attempts to retrieve released and unreleased file metadata; If not authorized to read unreleased only released is returned
 * If released is specified will only return released
 * If unreleased is specified will only return unreleased if authorized. If not authorized, an Invalid Access ResourceError is thrown
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {number} learningObjectRevision [The revision number of the Learning Object]
 * @returns {Promise<LearningObjectFile[]>}
 */
export async function getAllFileMetadata({
  requester,
  learningObjectId,
  filter,
}: {
  requester: Requester;
  learningObjectId: string;
  filter?: FileMetadataFilter;
}): Promise<LearningObjectFile[]> {
  try {
    validateRequestParams({
      operation: 'Get all file metadata',
      values: [
        {
          value: learningObjectId,
          validator: Validators.stringHasContent,
          propertyName: 'Learning Object id',
        },
      ],
    });
    const learningObject = await Gateways.learningObjectGateway().getActiveLearningObjectSummary(
      {
        requester,
        id: learningObjectId,
      },
    );

    authorizeReadAccess({ learningObject, requester });
    // if (!filter || filter === 'released') {
    //   const releasedObject: LearningObjectSummary = await Gateways.learningObjectGateway().getReleasedLearningObjectSummary(
    //     learningObjectId,
    //   );
    //   releasedFiles$ = Gateways.learningObjectGateway()
    //     .getReleasedFiles(learningObjectId)
    //     .then(files => files.map(appendFilePreviewUrls(releasedObject)));
    //   if (filter === 'released') return releasedFiles$;
    // }
    // const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
    //   { requester, id: learningObjectId },
    // );

    // try {
    //   authorizeReadAccess({ learningObject, requester });
    // } catch (e) {
    //   if (filter === 'unreleased') throw e;
    //   return releasedFiles$;
    // }

    // const workingFiles$ = Drivers.datastore()
    //   .fetchAllFileMeta(learningObjectId)
    //   .then(files =>
    //     files.map(file =>
    //       transformFileMetaToLearningObjectFile({
    //         authorUsername: learningObject.author.username,
    //         learningObjectId: learningObject.id,
    //         file,
    //       }),
    //     ),
    //   );

    // if (filter === 'unreleased') return workingFiles$;

    // return Promise.all([
    //   releasedFiles$.catch(handleReleasedFilesNotFound),
    //   workingFiles$,
    // ]).then(([releasedFiles, workingFiles]) => [
    //   ...releasedFiles,
    //   ...workingFiles,
    // ]);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Appends file preview urls to files
 *
 * @param {LearningObjectSummary} learningObject
 * @returns {(
 *   value: LearningObjectFile,
 *   index: number,
 *   array: LearningObjectFile[],
 * ) => LearningObjectFile}
 */
function appendFilePreviewUrls(
  learningObject: LearningObjectSummary,
): (
  value: LearningObjectFile,
  index: number,
  array: LearningObjectFile[],
) => LearningObjectFile {
  return file => {
    file.previewUrl = getFilePreviewUrl({
      authorUsername: learningObject.author.username,
      learningObjectId: learningObject.id,
      unreleased: learningObject.status !== LearningObject.Status.RELEASED,
      fileId: file.id,
      extension: file.extension,
    });
    return file;
  };
}

/**
 * Handles NotFound ResourceError when requesting released files by returning an empty array
 *
 * This is in place to avoid service failures in the case where a Learning Object has not yet been released,
 * so it will not have any released files.
 *
 * This should only be used in the case where released files are not explicitly requested.
 *
 * @param {Error} e
 * @returns {(any[] | never)}
 */
function handleReleasedFilesNotFound(e: Error): any[] | never {
  if (e instanceof ResourceError && e.name === ResourceErrorReason.NOT_FOUND) {
    return [];
  }
  throw e;
}

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
export async function addFileMeta({
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
 * Performs update on FileMetadataDocument
 *
 * @export
 *
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} id [Id of the file meta to retrieve]
 * @param {FileMetadataUpdate} updates [The file metadata to be added to the Learning Object]
 *
 * @returns {Promise<void>}
 */
export async function updateFileMeta({
  requester,
  learningObjectId,
  id,
  updates,
}: {
  requester: Requester;
  learningObjectId: string;
  id: string;
  updates: FileMetadataUpdate;
}): Promise<void> {
  try {
    validateRequestParams({
      operation: 'Get all file metadata',
      values: [
        {
          value: learningObjectId,
          validator: Validators.stringHasContent,
          propertyName: 'Learning Object id',
        },
        {
          value: id,
          validator: Validators.stringHasContent,
          propertyName: 'File metadata id',
        },
        {
          value: updates,
          validator: Validators.valueDefined,
          propertyName: 'File metadata updates',
        },
      ],
    });

    const cleanUpdates = sanitizeFileMetaUpdates(updates);
    cleanUpdates.lastUpdatedDate = Date.now().toString();

    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
      { requester, id: learningObjectId },
    );
    authorizeWriteAccess({ learningObject, requester });
    await Drivers.datastore().updateFileMeta({ id, updates: cleanUpdates });
    Gateways.learningObjectGateway().updateObjectLastModifiedDate(
      learningObjectId,
    );
  } catch (e) {
    handleError(e);
  }
}

/**
 * Deletes single file metadata document by id
 *
 * Only authors, admins, and editors can delete file metadata document
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} id [Id of the file meta to retrieve]
 *
 * @returns {Promise<void>}
 */
export async function deleteFileMeta({
  requester,
  learningObjectId,
  id,
}: {
  requester: Requester;
  learningObjectId: string;
  id: string;
}): Promise<void> {
  try {
    validateRequestParams({
      operation: 'Delete file metadata',
      values: [
        {
          value: learningObjectId,
          validator: Validators.stringHasContent,
          propertyName: 'Learning Object id',
        },
        {
          value: id,
          validator: Validators.stringHasContent,
          propertyName: 'File metadata id',
        },
      ],
    });
    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
      { requester, id: learningObjectId },
    );

    authorizeWriteAccess({ learningObject, requester });

    const fileMeta = await Drivers.datastore().fetchFileMeta(id);

    if (!fileMeta) {
      throw new ResourceError(
        `Unable to delete file ${id}. File does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }

    await Drivers.datastore().deleteFileMeta(id);
    Gateways.fileManager()
      .deleteFile({
        authorUsername: learningObject.author.username,
        learningObjectId: learningObject.id,
        learningObjectRevisionId: learningObject.revision,
        path: fileMeta.fullPath,
      })
      .catch(reportError);
    Gateways.learningObjectGateway().updateObjectLastModifiedDate(
      learningObjectId,
    );
  } catch (e) {
    handleError(e);
  }
}

/**
 * Deletes all file metadata documents for a Learning Object
 *
 * Only authors, admins, and editors can delete file metadata document
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 *
 * @returns {Promise<void>}
 */
export async function deleteAllFileMetadata({
  requester,
  learningObjectId,
}: {
  requester: Requester;
  learningObjectId: string;
}): Promise<void> {
  try {
    validateRequestParams({
      operation: 'Delete all file metadata',
      values: [
        {
          value: learningObjectId,
          validator: Validators.stringHasContent,
          propertyName: 'Learning Object id',
        },
      ],
    });

    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
      { requester, id: learningObjectId },
    );

    authorizeWriteAccess({ learningObject, requester });

    await Drivers.datastore().deleteAllFileMetadata(learningObjectId);
    Gateways.fileManager()
      .deleteFolder({
        authorUsername: learningObject.author.username,
        learningObjectId: learningObject.id,
        learningObjectRevisionId: learningObject.revision,
        path: '/',
      })
      .catch(reportError);
  } catch (e) {
    handleError(e);
  }
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
    previewUrl: getFilePreviewUrl({
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

/**
 * Sanitizes updates by trimming strings and only returning fields that can be updated by user inputs
 *
 * @param {FileMetadataUpdate} updates [The updates to be sanitized]
 * @returns {FileMetadataUpdate}
 */
function sanitizeFileMetaUpdates(
  updates: FileMetadataUpdate,
): FileMetadataUpdate {
  return sanitizeObject(
    {
      object: {
        description: updates.description,
        fullPath: updates.fullPath,
        name: updates.name,
      },
    },
    false,
  ) as FileMetadataUpdate;
}

/**
 * Validates required properties are defined and have valid values
 *
 * @param {FileMetadata} file [The file metadata to be validated]
 */
function validateFileMeta(file: FileMetadata) {
  const invalidInput = new ResourceError('', ResourceErrorReason.BAD_REQUEST);
  if (!Validators.stringHasContent(file.ETag)) {
    invalidInput.message = 'File metadata must contain a valid ETag.';
    throw invalidInput;
  }
  if (!Validators.stringHasContent(file.name)) {
    invalidInput.message = 'File metadata must contain a file name.';
    throw invalidInput;
  }
}

const MICROSOFT_EXTENSIONS = [
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'odt',
  'ott',
  'oth',
  'odm',
];

const CAN_PREVIEW = ['pdf', ...MICROSOFT_EXTENSIONS];

/**
 * Returns preview url for file based on extension
 * If the file's extension matches a Microsoft file extension, the Microsoft preview url for the file is returned
 * If the file's extension can be opened in browser, the file's url is returned
 * If the extension does not match any case, an empty string is returned.
 *
 * @export
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} authorUsername [Username of the LearningObject's author the file meta belongs to]
 * @param {string} fileId [The id of the file metadata]
 * @param {string} extension [The file type of the file including the '.' (ie. '.pdf')]
 *
 * @returns {string} [Preview url]
 */
export function getFilePreviewUrl({
  authorUsername,
  learningObjectId,
  fileId,
  extension,
  unreleased,
}: {
  authorUsername: string;
  learningObjectId: string;
  fileId: string;
  extension: string;
  unreleased?: boolean;
}): string {
  const extensionType = extension
    ? extension
        .trim()
        .toLowerCase()
        .replace('.', '')
    : null;
  if (CAN_PREVIEW.includes(extensionType)) {
    if (MICROSOFT_EXTENSIONS.includes(extensionType)) {
      return generatePreviewUrl({
        authorUsername,
        learningObjectId,
        fileId,
        unreleased,
        microsoftPreview: true,
      });
    }
    return generatePreviewUrl({
      authorUsername,
      learningObjectId,
      fileId,
      unreleased,
    });
  }
  return null;
}

/**
 * Generates preview url for a file.
 *
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} authorUsername [Username of the LearningObject's author the file meta belongs to]
 * @param {string} fileId [The id of the file metadata]
 * @param {boolean} microsoftPreview [Whether or not the file can be previewed using Microsoft's file previewer]
 * @returns {string}
 */
function generatePreviewUrl({
  learningObjectId,
  authorUsername,
  fileId,
  unreleased,
  microsoftPreview,
}: {
  learningObjectId: string;
  authorUsername: string;
  fileId: string;
  unreleased?: boolean;
  microsoftPreview?: boolean;
}): string {
  let fileSource =
    `${FILE_API_URI}/users/${authorUsername}/learning-objects/${learningObjectId}/materials/files/${fileId}/download` +
    `?status=${unreleased ? 'unreleased' : 'released'}`;
  if (microsoftPreview) {
    return `${MICROSOFT_PREVIEW_URL}?src=${fileSource}`;
  }
  return fileSource + '&open=true';
}
