import { Readable } from 'stream';
import { FileUpload, DownloadFilter, Requester, AccessGroup } from '../typings';
import { ResourceError, ResourceErrorReason } from '../../shared/errors';
import { LearningObjectSummary } from '../../shared/types';
import { Drivers, Gateways } from './shared/dependencies';

/**
 * FIXME:
 * Since no authorization can be done for downloads as of yet due to Microsoft previews needing access to files;
 * this service token is used to fetch file metadata of Learning Objects in review on behalf of the requester.
 *
 * The Admin privilege is given so that existing functionality does not break, but only allows the service to retrieve file metadata for Learning Objects in review.
 *
 * This is a temporary patch and should be swapped for authorization logic using JWT payload/some other temporary key to validate the requester has access to the requested file.
 */
const serviceToken: Partial<Requester> = {
  accessGroups: [AccessGroup.ADMIN],
};

/**
 * Gets readable stream for a single file from a user's Learning Object
 *
 * @export
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {string} learningObjectId [The id of the Learning Object to upload file to]
 * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
 * @param {string} path [The path of the file to stream]
 *
 * @returns {Promise<void>}
 */
export async function getFileStream({
  authorUsername,
  learningObjectCUID,
  learningObjectRevisionId,
  path,
}: {
  authorUsername: string;
  learningObjectCUID: string;
  learningObjectRevisionId: number;
  path: string;
}): Promise<Readable> {
  return Drivers.fileManager().streamFile({
    authorUsername,
    learningObjectCUID,
    learningObjectRevisionId,
    path,
  });
}

/**
 * Instructs file manager to upload a single file to a user's Learning Object
 *
 * @export
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {string} learningObjectId [The id of the Learning Object to upload file to]
 * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
 * @param {FileUpload} file [Object containing file data and the path the file should be uploaded to]
 *
 * @returns {Promise<void>}
 */
export async function uploadFile({
  authorUsername,
  learningObjectCUID,
  learningObjectRevisionId,
  file,
}: {
  authorUsername: string;
  learningObjectCUID: string;
  learningObjectRevisionId: number;
  file: FileUpload;
}): Promise<void> {
  await Drivers.fileManager().upload({
    authorUsername,
    learningObjectCUID,
    learningObjectRevisionId,
    file,
  });
}

/**
 * Instructs file manager to delete a single file from a user's Learning Object
 *
 * @export
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {string} learningObjectId [The id of the Learning Object to upload file to]
 * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
 * @param {string} path [The path of the file to delete]
 *
 * @returns {Promise<void>}
 */
export async function deleteFile({
  authorUsername,
  learningObjectCUID,
  learningObjectRevisionId,
  path,
}: {
  authorUsername: string;
  learningObjectCUID: string;
  learningObjectRevisionId: number;
  path: string;
}): Promise<void> {
  await Drivers.fileManager().delete({
    authorUsername,
    learningObjectCUID,
    learningObjectRevisionId,
    path,
  });
}

/**
 * Instructs file manager to delete all contents within a user's Learning Object's folder
 *
 * @export
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {string} learningObjectId [The id of the Learning Object to upload file to]
 * @param {number} learningObjectRevisionId [The revision id of the Learning Object]
 * @param {string} path [The path of the folder to delete]
 * @returns {Promise<void>}
 */
export async function deleteFolder({
  authorUsername,
  learningObjectCUID,
  learningObjectRevisionId,
  path,
}: {
  authorUsername: string;
  learningObjectCUID: string;
  learningObjectRevisionId: number;
  path: string;
}): Promise<void> {
  await Drivers.fileManager().deleteFolder({
    authorUsername,
    learningObjectCUID,
    learningObjectRevisionId,
    path,
  });
}

/**
 * Sends a file back to the caller as a readable stream.
 *
 * The function fetches the Learning object summary.
 * An error is thrown if the summary is not returned.
 * After the Learning Object summary is  returned, the filter is
 * used to retrieve the appropriate file metadata.
 * Finally, the function calls the FileManager and ensures that it
 * has access to the requested resource. If it does, then the file stream is opened.
 * An error is thrown otherwise.
 *
 * @param params.learningObjectId the identifier of the Learning Object that the file belongs to
 * @param params.fileId the identifier of the file to be downloaded
 * @param params.dataStore the gateway for data operations
 * @param params.fileManager the gateway for file operations
 * @param params.author the username of the Learning Object's author
 *
 * @returns a Promise with the filename, mimeType, and readable stream of file data.
 */
export async function downloadSingleFile({
  learningObjectId,
  fileId,
  author,
  requester,
  filter,
}: {
  learningObjectId: string;
  fileId: string;
  author: string;
  requester?: Requester;
  filter?: DownloadFilter;
}): Promise<{ filename: string; mimeType: string; stream: Readable }> {
  let learningObject, fileMetaData;
  // To maintain existing functionality, service token is elevated to author to fetch unreleased file meta
  serviceToken.username = author;
  learningObject = await Gateways.learningObjectGateway().getLearningObjectSummary(
    {
      id: learningObjectId,
      requester: serviceToken as Requester,
    },
  );

  if (!learningObject) {
    throw new Error(
      `Could not download the requested file ${fileId}. Learning object ${learningObjectId} does not exist.`,
    );
  }

  fileMetaData = await Gateways.fileMetadataGateway().getFileMetadata({
    requester: serviceToken as Requester,
    learningObjectId: learningObjectId,
    fileId,
  });

  if (!fileMetaData) {
    return Promise.reject({
      object: learningObject,
      message: `File not found`,
    });
  }
  const mimeType = fileMetaData.fileType;
  // Check if the file manager has access to the resource before opening a stream
  if (
    await Drivers.fileManager().hasAccess({
      authorUsername: author,
      learningObjectCUID: learningObject.cuid,
      learningObjectRevisionId: fileMetaData.storageRevision,
      path: fileMetaData.fullPath || fileMetaData.name,
    })
  ) {
    const stream = await Drivers.fileManager().streamFile({
      authorUsername: author,
      learningObjectCUID: learningObject.cuid,
      learningObjectRevisionId: fileMetaData.storageRevision,
      path: fileMetaData.fullPath || fileMetaData.name,
    });
    return { mimeType, stream, filename: fileMetaData.name };
  } else {
    throw { message: 'File not found', object: { name: learningObject.name } };
  }
}

/**
 * Bypasses NotFound Resource Error when requesting a file if `condition` is true by returning null
 *
 * This allows execution to continue
 *
 * @param {boolean} condition
 * @returns {((e: Error) => null | never)}
 */
function bypassFileNotFoundError(
  condition: boolean,
): (e: Error) => null | never {
  return (e: Error) => {
    if (
      condition &&
      e instanceof ResourceError &&
      e.name === ResourceErrorReason.NOT_FOUND
    ) {
      return null;
    }
    throw e;
  };
}
