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
}: {
  requester: Requester;
  learningObjectId: string;
  id: string;
}): Promise<LearningObjectFile> {
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

    const learningObjectRevision = await Drivers.datastore().fetchRevisionId(
      id,
    );
    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getLearningObjectRevisionSummary(
      { requester, id: learningObjectId, revision: learningObjectRevision },
    );

    authorizeReadAccess({ learningObject, requester });

    const file = await Drivers.datastore().fetchFileMeta(id);
    return transformFileMetaToLearningObjectFile(file);
  } catch (e) {
    handleError(e);
  }
}

/**
 * Retrieves all file metadata that belongs to a Learning Object
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
  learningObjectRevision,
}: {
  requester: Requester;
  learningObjectId: string;
  learningObjectRevision?: number;
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
    let learningObject: LearningObjectSummary;

    if (learningObjectRevision != null) {
      learningObject = await Gateways.learningObjectGateway().getLearningObjectRevisionSummary(
        { requester, id: learningObjectId, revision: learningObjectRevision },
      );
    } else {
      learningObject = await Gateways.learningObjectGateway().getActiveLearningObjectSummary(
        { requester, id: learningObjectId },
      );
    }

    authorizeReadAccess({ learningObject, requester });

    const files = await Drivers.datastore().fetchAllFileMeta({
      learningObjectId,
      learningObjectRevision: learningObject.revision,
    });
    return files.map(transformFileMetaToLearningObjectFile);
  } catch (e) {
    handleError(e);
  }
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

    return await Promise.all(
      inserts.map(handleFileMetadataInsert(learningObject)),
    );
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
      learningObjectRevision: learningObject.revision,
      fullPath: insert.fullPath,
    });
    if (existingFile) {
      delete insert.createdDate;
      await Drivers.datastore().updateFileMeta({
        id: existingFile.id,
        updates: insert,
      });
      return transformFileMetaToLearningObjectFile(existingFile);
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
  return {
    createdDate: Date.now().toString(),
    description: file.description || '',
    ETag: file.ETag,
    extension: file.name.split('.').pop(),
    fullPath: file.fullPath || file.name,
    lastUpdatedDate: Date.now().toString(),
    learningObjectId: learningObject.id,
    learningObjectRevision: learningObject.revision,
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
  } catch (e) {
    handleError(e);
  }
}

/**
 * Deletes all file metadata documents for a revision of a Learning Object
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

    await Drivers.datastore().deleteAllFileMeta({
      learningObjectId,
      learningObjectRevision: learningObject.revision,
    });
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
      errMsg += ` ${val} is not a valid value for ${val.propertyName}.`;
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
