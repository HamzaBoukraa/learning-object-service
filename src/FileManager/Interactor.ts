import { FileManagerModule } from './FileManagerModule';
import { Readable } from 'stream';
import { FileUpload, DownloadFilter, Requester, AccessGroup } from './typings';
import { ResourceError, ResourceErrorReason } from '../shared/errors';
import { FileManager, LearningObjectGateway, FileMetadataGateway } from './interfaces';
import { LearningObjectSummary } from '../shared/types';

namespace Drivers {
  export const fileManager = () => FileManagerModule.resolveDependency(FileManager);
}

namespace Gateways {
  export const learningObjectGateway = () => FileManagerModule.resolveDependency(LearningObjectGateway);
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
 * Instructs file manager to upload a single file to a user's Learning Object
 *
 * @export
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {string} learningObjectId [The id of the Learning Object to upload file to]
 * @param {FileUpload} file [Object containing file data and the path the file should be uploaded to]
 *
 * @returns {Promise<void>}
 */
export async function uploadFile({ authorUsername, learningObjectId, file }: {
  authorUsername: string,
  learningObjectId: string,
  file: FileUpload,
}): Promise<void> {
  await Drivers.fileManager().upload({
    authorUsername,
    learningObjectId,
    file,
  });
}

/**
 * Instructs file manager to delete a single file from a user's Learning Object
 *
 * @export
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {string} learningObjectId [The id of the Learning Object to upload file to]
 * @param {string} path [The path of the file to delete]
 *
 * @returns {Promise<void>}
 */
export async function deleteFile({ authorUsername, learningObjectId, path }: {
  authorUsername: string,
  learningObjectId: string,
  path: string;
}): Promise<void> {
  await Drivers.fileManager().delete({
    authorUsername,
    learningObjectId,
    path,
  });
}

/**
 * Instructs file manager to delete all contents within a user's Learning Object's folder
 *
 * @export
 * @param {string} authorUsername [The Learning Object's author's username]
 * @param {string} learningObjectId [The id of the Learning Object to upload file to]
 * @param {string} path [The path of the folder to delete]
 * @returns {Promise<void>}
 */
export async function deleteFolder({ authorUsername, learningObjectId, path }: {
  authorUsername: string,
  learningObjectId: string,
  path: string;
}): Promise<void> {
  await Drivers.fileManager().deleteFolder({
    authorUsername, learningObjectId, path,
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
export async function downloadSingleFile({ learningObjectId, fileId, author, requester, filter }: {
  learningObjectId: string;
  fileId: string;
  author: string;
  requester?: Requester;
  filter?: DownloadFilter;
}): Promise<{ filename: string; mimeType: string; stream: Readable }> {
  let learningObject, fileMetaData;
  // To maintain existing functionality, service token is elevated to author to fetch unreleased file meta
  serviceToken.username = author;
  learningObject = await getLearningObjectSummary({ learningObjectId, requester: serviceToken as Requester, filter });

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
  const mimeType = fileMetaData.fileType;
  // Check if the file manager has access to the resource before opening a stream
  if (await Drivers.fileManager().hasAccess({ authorUsername: author, learningObjectId, path: fileMetaData.fullPath || fileMetaData.name })) {
    const stream = Drivers.fileManager().streamFile({ authorUsername: author, learningObjectId, path: fileMetaData.fullPath || fileMetaData.name });
    return { mimeType, stream, filename: fileMetaData.name };
  } else {
    throw { message: 'File not found', object: { name: learningObject.name } };
  }
}

/**
 * Gets Learning Object summary based on specified download filter
 *
 * If `released` is specified returns released Learning Object summary
 * If `unreleased` is specifed returns working Learning Object summary
 * Otherwise, the active Learning Object summary is returned
 *
 * @param {*} { requester: Requester, learningObjectId: string, filter: DownloadFilter }
 * @returns {Promise<LearningObjectSummary>}
 */
function getLearningObjectSummary({ requester, learningObjectId, filter }: { requester: Requester, learningObjectId: string, filter: DownloadFilter }): Promise<LearningObjectSummary> {
  switch (filter) {
    case 'released':
      // Get released summary
      return Gateways.learningObjectGateway().getReleasedLearningObjectSummary(learningObjectId);
    case 'unreleased':
      // Get unreleased summary
      return Gateways.learningObjectGateway().getWorkingLearningObjectSummary({ id: learningObjectId, requester });
    default:
      // Get active summary
      return Gateways.learningObjectGateway().getActiveLearningObjectSummary({ id: learningObjectId, requester });
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


