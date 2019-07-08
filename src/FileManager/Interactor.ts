import { FileManagerModule } from './FileManagerModule';
import { Readable } from 'stream';
import { FileUpload, DownloadFilter, Requester, AccessGroup } from './typings';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { FileManager, LearningObjectGateway, FileMetadataGateway } from './interfaces';

namespace Drivers {
  export const fileManager = () => FileManagerModule.resolveDependency(FileManager);
  export const learningObjectGateway = () => FileManagerModule.resolveDependency(LearningObjectGateway);
}

namespace Gateways {
  export const fileMetadataGateway = () => FileManagerModule.resolveDependency(FileMetadataGateway);
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
const serviceToken: Partial<Requester> = {
  accessGroups: [AccessGroup.ADMIN],
};

/**
 * Instructs file manager to upload a single file
 *
 * @export
 * @param {{ file: FileUpload }} params
 * @returns {Promise<void>}
 */
export async function uploadFile(params: {
  file: FileUpload,
}): Promise<void> {
  await Drivers.fileManager().upload({
    file: params.file,
  });
}

/**
 * Instructs file manager to delete a single file
 *
 * @export
 * @param {{ path: string }} params
 * @returns {Promise<void>}
 */
export async function deleteFile(params: {
  path: string;
}): Promise<void> {
  await Drivers.fileManager().delete({
    path: params.path,
  });
}

/**
 * Instructs file manager to delete all contents within a folder
 *
 * @export
 * @param {{ path: string }} params
 * @returns {Promise<void>}
 */
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
export async function downloadSingleFile({learningObjectId, fileId, author, requester, filter}: {
  learningObjectId: string;
  fileId: string;
  author: string;
  requester?: Requester;
  filter?: DownloadFilter;
}): Promise<{ filename: string; mimeType: string; stream: Readable }> {
  let learningObject, fileMetaData;

  learningObject = await Drivers.learningObjectGateway().getLearningObjectById({
    id: learningObjectId,
    requester: requester,
  });

  if (!learningObject) {
    throw new Error(
      `Could not download the requested file ${fileId}. Learning object ${learningObjectId} does not exist.`,
    );
  }

  if (!filter || filter === 'released') {
    fileMetaData = await Gateways.fileMetadataGateway().getFileMetadata({
      requester: serviceToken as Requester,
      learningObjectId: learningObjectId,
      id: fileId,
      filter: 'released',
    }).catch(bypassFileNotFoundError(filter !== 'released'));
  }

  if (
    (!fileMetaData && fileId !== 'released') ||
    filter === 'unreleased'
  ) {
    // Collect unreleased file metadata from FileMetadata module

    // To maintain existing functionality, service token is elevated to author to fetch unreleased file meta
    serviceToken.username = learningObject.author.username;
    fileMetaData = await Gateways.fileMetadataGateway().getFileMetadata({
      requester: serviceToken as Requester,
      learningObjectId: learningObjectId,
      id: fileId,
      filter: 'unreleased',
    });
  }

  if (!fileMetaData) {
    return Promise.reject({
      object: learningObject,
      message: `File not found`,
    });
  }

  const path = `${author}/${learningObjectId}/${
    fileMetaData.fullPath ? fileMetaData.fullPath : fileMetaData.name
  }`;
  const mimeType = fileMetaData.fileType;
  // Check if the file manager has access to the resource before opening a stream
  if (await Drivers.fileManager().hasAccess(path)) {
    const stream = Drivers.fileManager().streamWorkingCopyFile({ path });
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


