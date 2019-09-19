import { Requester, LearningObjectSummary } from '../../typings';
import { validateRequestParams } from '../shared/validateRequestParams/validateRequestParams';
import * as Validators from '../shared/validators';
import { Gateways, Drivers } from '../shared/resolvedDependencies';
import { authorizeWriteAccess } from '../../../shared/AuthorizationManager';
import { ResourceError, ResourceErrorReason, handleError } from '../../../shared/errors';
import { reportError } from '../../../shared/SentryConnector';


/**
 * Deletes single file metadata document by id
 *
 * Only authors, admins, and editors can delete file metadata document
 *
 * @export
 * @param {Requester} requester [Information about the requester]
 * @param {string} learningObjectId [Id of the LearningObject the file meta belongs to]
 * @param {string} id [Id of the file meta to retrieve]
 *
 * @returns {Promise<void>}
 */
export async function deleteFileMeta({
    requester,
    learningObjectId,
    id,
}: {
    requester: Requester;
    learningObjectId: string;
    id: string;
}): Promise<void> {
    try {
        validateRequestParams({
            operation: 'Delete file metadata',
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
            ],
        });
        const learningObject: LearningObjectSummary = await Gateways.learningObjectGateway().getWorkingLearningObjectSummary(
            { requester, id: learningObjectId },
        );

        authorizeWriteAccess({ learningObject, requester });

        const fileMeta = await Drivers.datastore().fetchFileMeta(id);

        if (!fileMeta) {
            throw new ResourceError(
            `Unable to delete file ${id}. File does not exist.`,
            ResourceErrorReason.NOT_FOUND,
            );
        }

        await Drivers.datastore().deleteFileMeta(id);
        Gateways.fileManager()
            .deleteFile({
            authorUsername: learningObject.author.username,
            learningObjectId: learningObject.id,
            learningObjectRevisionId: learningObject.revision,
            path: fileMeta.fullPath,
            })
            .catch(reportError);
        Gateways.learningObjectGateway().updateObjectLastModifiedDate(
            learningObjectId,
        );
    } catch (e) {
        handleError(e);
    }
}
