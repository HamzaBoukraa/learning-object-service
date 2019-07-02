import { FileManagerModule as Module } from '.';
import { DataStore } from '../shared/interfaces/DataStore';

import { FileManager } from '../shared/interfaces/interfaces';
import { LearningObject } from '../shared/entity';
import { Readable } from 'stream';
import { MultipartFileUploadStatus, DZFile, FileUpload } from './typings/file-manager';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { FileManagerModuleDatastore } from './interfaces/FileManagerModuledatastore';
import { AccessGroup, UserToken } from '../shared/types';

namespace Drivers {
  export const fileManager = () => Module.resolveDependency(FileManager);
  export const dataStore = () => Module.resolveDependency(FileManagerModuleDatastore);
}

/**
 * FIXME:
 * Since no authorization can be done for downloads as of yet due to Microsoft previews needing access to files;
 * this service token is used to fetch file metadata of Learning Objects in review on behalf of the requester.
 *
 * The Admin privilege is given so that existing functionality does not break, but only allows the service to retrieve file metadata for Learning Objects in review.
 *
 * This is a temporary patch and should be swapped for authorization logic using JWT payload/some other temporary key to validate the requester has access to the requested file.
 */
const serviceToken: Partial<UserToken> = {
  accessGroups: [AccessGroup.ADMIN],
};

/**
 * Instructs file manager to upload a single file
 *
 * @export
 * @param {{ FileManager }} fileManager
 * @param {{ FileUpload }} file
 * @returns {string}
 */
export async function uploadFile(params: {
  file: FileUpload,
}): Promise<void> {
  await Drivers.fileManager().upload({
    file: params.file,
  });
}

/**
 * Instructs file manager to delete  a single file
 *
 * @export
 * @param {{ FileManager }} fileManager
 * @param {{ FileUpload }} file
 * @returns {string}
 */
export async function deleteFile(params: {
  path: string;
}): Promise<void> {
  await Drivers.fileManager().delete({
    path: params.path,
  });
}

export async function deleteFolder(params: {
  path: string;
}): Promise<void> {
  await Drivers.fileManager().deleteFolder({
    path: params.path,
  });
}

/**
 * Sends a file back to the caller as a readable stream.
 *
 * @param params.learningObjectId the identifier of the Learning Object that the file belongs to
 * @param params.fileId the identifier of the file to be downloaded
 * @param params.dataStore the gateway for data operations
 * @param params.fileManager the gateway for file operations
 * @param params.author the username of the Learning Object's author
 *
 * @returns a Promise with the filename, mimeType, and readable stream of file data.
 */
export async function downloadSingleFile(params: {
  learningObjectId: string;
  fileId: string;
  dataStore: DataStore;
  fileManager: FileManager;
  author: string;
  requester?: UserToken;
  filter?: DownloadFilter;
}): Promise<{ filename: string; mimeType: string; stream: Readable }> {
  let learningObject, fileMetaData;

  learningObject = await params.dataStore.fetchLearningObject({
    id: params.learningObjectId,
    full: false,
  });

  if (!learningObject) {
    throw new Error(
      `Learning object ${params.learningObjectId} does not exist.`,
    );
  }

  if (!params.filter || params.filter === 'released') {
    fileMetaData = await FileMetadata.geFileMetadata({
      requester: serviceToken as UserToken,
      learningObjectId: params.learningObjectId,
      id: params.fileId,
      filter: 'released',
    }).catch(bypassFileNotFoundError(params.filter !== 'released'));
  }

  if (
    (!fileMetaData && params.fileId !== 'released') ||
    params.filter === 'unreleased'
  ) {
    // Collect unreleased file metadata from FileMetadata module

    // To maintain existing functionality, service token is elevated to author to fetch unreleased file meta
    serviceToken.username = learningObject.author.username;
    fileMetaData = await FileMetadata.geFileMetadata({
      requester: serviceToken as UserToken,
      learningObjectId: params.learningObjectId,
      id: params.fileId,
      filter: 'unreleased',
    });
  }

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
    const stream = params.fileManager.streamWorkingCopyFile({ path });
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


