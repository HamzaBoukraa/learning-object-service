import { LearningObject } from '../../../shared/entity';
import { UserToken } from '../../../shared/types';
import { requesterIsAdminOrEditor } from '../../../shared/AuthorizationManager';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';
import { ERROR_MESSAGES } from './errors';
import { getLearningObjectById } from '../LearningObjectInteractor';

interface TransferLearningObjectAuthorshipParams {
    learningObjectID: string;
    requester: UserToken;
}

export async function transferLearningObjectOwnership(
    params: TransferLearningObjectAuthorshipParams,
): Promise<LearningObject> {
    const isAdminOrEditor = requesterIsAdminOrEditor(params.requester);
    if (!isAdminOrEditor) {
        throw new ResourceError(
            ERROR_MESSAGES.FORBIDDEN,
            ResourceErrorReason.FORBIDDEN,
        );
    }

    const learningObject = await fetchLearningObject({
        id,
    });

    return {} as LearningObject;
}

