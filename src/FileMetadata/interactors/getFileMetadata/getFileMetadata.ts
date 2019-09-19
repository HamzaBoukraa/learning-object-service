import { validateRequestParams } from '../shared/validateRequestParams';
import {
  Requester,
  LearningObjectFile,
  LearningObjectSummary,
  FileMetadataDocument,
} from '../../typings';
import {
  requesterIsPrivileged,
  authorizeReadAccess,
} from '../../../shared/AuthorizationManager';
import { handleError } from '../../../FileAccessIdentities/adapters/ExpressHTTPAdapter/handlers/shared';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
import { id } from 'pdfkit/js/reference';
import { FileMetadataModule } from '../../FileMetadataModule';
import { FileMetaDatastore, FileManagerGateway } from '../../interfaces';
import { LearningObjectGateway } from '../../../FileManager/interfaces';
import { getFilePreviewUrl } from '../Interactor';

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
export async function getFileMetadata({
  requester,
  learningObjectId,
  fileId,
}: {
  requester: Requester;
  learningObjectId: string;
  fileId: string;
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
          value: fileId,
          validator: Validators.stringHasContent,
          propertyName: 'File metadata id',
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

    const file = await Drivers.datastore().fetchFileMeta(fileId);
    if (!file) {
      throw new ResourceError(
        `Unable to get file metadata for file ${id}. File does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    return transformFileMetaToLearningObjectFile({
      authorUsername: learningObject.author.username,
      learningObjectId: learningObject.author.id,
      file,
    });
  } catch (e) {
    handleError(e);
  }
}

// TODOx100: move this to a helper function directory for all file meta-data operations
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
