import { FileMetadata as Module } from '.';
import { FileMetaDatastore, LearningObjectGateway } from './interfaces';
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
import { handleError } from '../interactors/LearningObjectInteractor';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import {
  authorizeWriteAccess,
  authorizeReadAccess,
} from './AuthorizationManager';
import { sanitizeObject, toNumber } from '../shared/functions';

namespace Drivers {
  export const datastore = () => Module.resolveDependency(FileMetaDatastore);
}

namespace Gateways {
  export const learningObjectGateway = () =>
    Module.resolveDependency(LearningObjectGateway);
}

/**
 * Retrieves file metadata by id
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
 * @param {string} id [Id of the file meta to retrieve]
 *
 * @returns {Promise<LearningObjectFile>}
 */
export async function getFileMeta({
  requester,
  learningObjectId,
  id,
  filter,
}: {
  requester: Requester;
  learningObjectId: string;
  id: string;
  filter?: FileMetadataFilter;
}): Promise<{
  released?: LearningObjectFile;
  unreleased?: LearningObjectFile;
}> {
  try {
    validateRequestParams({
      operation: 'Get file metadata',
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

    let releasedFile$: Promise<LearningObjectFile>;
    if (!filter || filter === 'released') {
      releasedFile$ = Gateways.learningObjectGateway().getReleasedFile({
        requester,
        id: learningObjectId,
        fileId: id,
      });
      if (filter === 'released') return { released: await releasedFile$ };
    }
    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
      { requester, id: learningObjectId },
    );

    try {
      authorizeReadAccess({ learningObject, requester });
    } catch (e) {
      if (filter === 'unreleased') throw e;
      return { released: await releasedFile$ };
    }

    const workingFile$ = Drivers.datastore()
      .fetchFileMeta(id)
      .then(transformFileMetaToLearningObjectFile);

    if (filter === 'unreleased') return { unreleased: await workingFile$ };

    return { released: await releasedFile$, unreleased: await workingFile$ };
  } catch (e) {
    handleError(e);
  }
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
export async function getAllFileMeta({
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
    let releasedFiles$: Promise<LearningObjectFile[]>;
    if (!filter || filter === 'released') {
      releasedFiles$ = Gateways.learningObjectGateway().getReleasedFiles({
        requester,
        id: learningObjectId,
      });
      if (filter === 'released') return releasedFiles$;
    }
    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
      { requester, id: learningObjectId },
    );

    try {
      authorizeReadAccess({ learningObject, requester });
    } catch (e) {
      if (filter === 'unreleased') throw e;
      return releasedFiles$;
    }

    const workingFiles$ = Drivers.datastore()
      .fetchAllFileMeta(learningObjectId)
      .then(files => files.map(transformFileMetaToLearningObjectFile));

    if (filter === 'unreleased') return workingFiles$;

    return Promise.all([
      releasedFiles$.catch(handleReleasedFilesNotFound),
      workingFiles$,
    ]).then(([releasedFiles, workingFiles]) => [
      ...releasedFiles,
      ...workingFiles,
    ]);
  } catch (e) {
    handleError(e);
  }
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
        ...existingFile,
        ...insert,
      });
    }
    return Drivers.datastore()
      .insertFileMeta(insert)
      .then(transformFileMetaToLearningObjectFile);
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
 * @returns
 */
function generateFileMetadataInserts(
  files: FileMetadata[],
  learningObject: LearningObjectSummary,
) {
  const inserts: FileMetadataInsert[] = [];
  files.forEach(async file => {
    const cleanFile = sanitizeObject({ object: file }, false);
    validateFileMeta(cleanFile);
    const newInsert: FileMetadataInsert = generateFileMetaInsert(
      cleanFile,
      learningObject,
    );
    inserts.push(newInsert);
  });
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
    mimeType: file.mimeType,
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

    await Drivers.datastore().deleteFileMeta(id);
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
export async function deleteAllFileMeta({
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

    await Drivers.datastore().deleteAllFileMeta(learningObjectId);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Transforms file metadata document into LearningObjectFile
 *
 * @param {FileMetadataDocument} file [File metadata to use to create LearningObjectFile]
 * @returns {LearningObjectFile}
 */
function transformFileMetaToLearningObjectFile(
  file: FileMetadataDocument,
): LearningObjectFile {
  return {
    id: file.id,
    name: file.name,
    fileType: file.mimeType,
    extension: file.extension,
    url: '',
    date: file.lastUpdatedDate,
    fullPath: file.fullPath,
    size: file.size,
    description: file.description,
    packageable: file.packageable,
  };
}

/**
 * Validates parameters using passed validators. If validator returns false, errors are generated.
 *
 * @param {string} operation [The operation being performed. Used to generate error message.]
 * @param {{ value: any; validator: any; propertyName: string }} values [The values to validate]
 * @returns {(void | never)}
 */
function validateRequestParams({
  operation,
  values,
}: {
  operation: string;
  values: { value: any; validator: any; propertyName: string }[];
}): void | never {
  let hasErrors = false;
  let errMsg = `Cannot ${operation}.`;
  values.forEach(val => {
    if (!val.validator(val.value)) {
      hasErrors = true;
      errMsg += ` ${val.value} is not a valid value for ${val.propertyName}.`;
    }
  });
  if (hasErrors) {
    throw new ResourceError(errMsg, ResourceErrorReason.BAD_REQUEST);
  }
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
  if (!Validators.stringHasContent(file.mimeType)) {
    invalidInput.message = 'File metadata must contain a valid mimeType.';
    throw invalidInput;
  }
  if (!Validators.stringHasContent(file.name)) {
    invalidInput.message = 'File metadata must contain a file name.';
    throw invalidInput;
  }
  if (!Validators.valueIsNumber(file.size)) {
    invalidInput.message =
      'File metadata must have a defined file size greater than zero.';
    throw invalidInput;
  }
}

namespace Validators {
  /**
   * Checks if value is defined
   *
   * @export
   * @param {*} val [The value to be validated]
   * @returns {boolean}
   */
  export function valueDefined(val: any): boolean {
    return val != null;
  }

  /**
   * Checks if string value contains characters and is not a string of empty spaces
   *
   * @export
   * @param {string} val [The value to be validated]
   * @returns {boolean}
   */
  export function stringHasContent(val: string): boolean {
    if (val == null) {
      return false;
    }
    val = val.trim();
    if (!val || val === 'null' || val === 'undefined') {
      return false;
    }
    return true;
  }

  /**
   * Checks if value is a number
   *
   * @export
   * @param {number} val [The value to be validated]
   * @returns {boolean}
   */
  export function valueIsNumber(val: number): boolean {
    return valueDefined(val) && !isNaN(+val);
  }
}
