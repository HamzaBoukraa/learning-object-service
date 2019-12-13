import { Requester, LearningObjectSummary } from '../../../FileMetadata/typings';
import { validateRequestParams } from '../../../FileMetadata/interactors/shared/validateRequestParams/validateRequestParams';
import * as Validators from '../../../FileMetadata/interactors/shared/validators';
import { Gateways } from '../../../FileMetadata/interactors/shared/resolvedDependencies';
import { authorizeWriteAccess } from '../../../shared/AuthorizationManager';
import { reportError } from '../../../shared/SentryConnector';
import { handleError } from '../../../shared/errors';
import { LearningObject } from '../../../shared/entity';

/**
 * Deletes all files for a Learning Object in S3
 *
 * Only authors, admins, and editors can delete files
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file belongs to]
 *
 * @returns {Promise<void>}
 */
export async function deleteAllFiles({
  requester,
  learningObject,
}: {
  requester: Requester;
  learningObject: LearningObject;
}): Promise<void> {
  try {
    validateRequestParams({
      operation: 'Delete all files from S3',
      values: [
        {
          value: learningObject.id,
          validator: Validators.stringHasContent,
          propertyName: 'Learning Object id',
        },
      ],
    });

    authorizeWriteAccess({ learningObject, requester });

    Gateways.fileManager()
      .deleteFolder({
        authorUsername: learningObject.author.username,
        learningObjectCUID: learningObject.cuid,
        version: learningObject.version,
        path: '/',
      });
  } catch (e) {
    handleError(e);
  }
}




