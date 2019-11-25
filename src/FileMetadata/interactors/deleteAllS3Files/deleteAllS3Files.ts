import { Requester, LearningObjectSummary } from '../../typings';
import { validateRequestParams } from '../shared/validateRequestParams/validateRequestParams';
import * as Validators from '../shared/validators';
import { Gateways } from '../shared/resolvedDependencies';
import { authorizeWriteAccess } from '../../../shared/AuthorizationManager';
import { reportError } from '../../../shared/SentryConnector';
import { handleError } from '../../../shared/errors';

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
export async function deleteAllS3Files({
  requester,
  learningObjectId,
}: {
  requester: Requester;
  learningObjectId: string;
}): Promise<void> {
  try {
    validateRequestParams({
      operation: 'Delete all files from S3',
      values: [
        {
          value: learningObjectId,
          validator: Validators.stringHasContent,
          propertyName: 'Learning Object id',
        },
      ],
    });

    const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getLearningObjectSummary(
      { requester, id: learningObjectId },
    );

    authorizeWriteAccess({ learningObject, requester });

    Gateways.fileManager()
      .deleteFolder({
        authorUsername: learningObject.author.username,
        learningObjectCUID: learningObject.cuid,
        version: learningObject.version,
        path: '/',
      })
      .catch(reportError);
  } catch (e) {
    handleError(e);
  }
}




