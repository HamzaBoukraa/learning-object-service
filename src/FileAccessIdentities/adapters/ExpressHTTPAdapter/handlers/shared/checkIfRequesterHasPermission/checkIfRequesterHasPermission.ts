import { ServiceToken } from '../../../../../../shared/types';

export function checkIfRequesterHasPermission(requester: ServiceToken): boolean {
    return (
        !requester.SERVICE_KEY
        || !(requester.SERVICE_KEY === process.env.USER_SERVICE_KEY)
    );
}
