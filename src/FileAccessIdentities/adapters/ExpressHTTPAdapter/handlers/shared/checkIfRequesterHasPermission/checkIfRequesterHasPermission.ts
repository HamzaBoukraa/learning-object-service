import { ResourceErrorReason, ResourceError } from '../../../../../../shared/errors';
import { ServiceToken } from '../../../../../../shared/types';

export function checkIfRequesterHasPermission(requester: ServiceToken) {
    if (
        !requester.SERVICE_KEY
        || !(requester.SERVICE_KEY === process.env.USER_SERVICE_KEY)
    ) {
        throw new ResourceError(
            'Requester does not have access',
            ResourceErrorReason.FORBIDDEN,
        );
    }
}
