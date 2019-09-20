import { Requester, LearningObjectFile } from '../../typings';
import { authorizeReadAccess } from '../../../shared/AuthorizationManager';
import { handleError } from '../../../FileAccessIdentities/adapters/ExpressHTTPAdapter/handlers/shared';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
import { FileMetadataModule } from '../../FileMetadataModule';
import { FileMetaDatastore, FileManagerGateway } from '../../interfaces';
import { LearningObjectGateway } from '../../../FileManager/interfaces';
import { validateRequestParams } from '../shared/validateRequestParams/validateRequestParams';
import * as Validators from '../shared/validators';
import { transformFileMetadataToLearningObjectFile } from '../shared/transformFileMetadataToLearningObjectFile/transformFileMetadataToLearningObjectFile';

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
    const learningObject = await Gateways.learningObjectGateway().getLearningObjectSummary(
      {
        requester,
        id: learningObjectId,
      },
    );

    const file = await Drivers.datastore().fetchFileMeta(fileId);
    if (!file) {
      throw new ResourceError(
        `Unable to get file metadata for file ${learningObjectId}. File does not exist.`,
        ResourceErrorReason.NOT_FOUND,
      );
    }
    return transformFileMetadataToLearningObjectFile({
      authorUsername: learningObject.author.username,
      learningObjectId: learningObject.author.id,
      file,
    });
  } catch (e) {
    handleError(e);
  }
}
