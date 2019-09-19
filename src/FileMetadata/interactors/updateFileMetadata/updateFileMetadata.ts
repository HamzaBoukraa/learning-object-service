import {
    Requester,
    FileMetadataUpdate,
    LearningObjectSummary,
} from '../../typings';
import { validateRequestParams } from '../shared/validateRequestParams/validateRequestParams';
import * as Validators from '../shared/validators';
import { Gateways, Drivers } from '../shared/resolvedDependencies';
import { authorizeWriteAccess } from '../../../shared/AuthorizationManager';
import { sanitizeObject } from '../../../shared/functions';
import { handleError } from '../../../shared/errors';

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
export async function updateFileMetadata({
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
