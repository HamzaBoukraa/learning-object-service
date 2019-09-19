import { Requester, LearningObjectSummary } from '../../typings';
import { validateRequestParams } from '../shared/validateRequestParams/validateRequestParams';
import * as Validators from '../shared/validators';
import { Gateways, Drivers } from '../shared/resolvedDependencies';
import { authorizeWriteAccess } from '../../../shared/AuthorizationManager';
import { reportError } from '../../../shared/SentryConnector';
import { handleError } from '../../../shared/errors';

/**
 * Deletes all file metadata documents for a Learning Object
 *
 * Only authors, admins, and editors can delete file metadata document
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 *
 * @returns {Promise<void>}
 */
export async function deleteAllFileMetadata({
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

      await Drivers.datastore().deleteAllFileMetadata(learningObjectId);
      Gateways.fileManager()
        .deleteFolder({
          authorUsername: learningObject.author.username,
          learningObjectId: learningObject.id,
          learningObjectRevisionId: learningObject.revision,
          path: '/',
        })
        .catch(reportError);
    } catch (e) {
      handleError(e);
    }
}
