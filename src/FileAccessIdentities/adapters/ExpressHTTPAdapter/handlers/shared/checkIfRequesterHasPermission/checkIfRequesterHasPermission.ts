import { ServiceToken } from '../../../../../../shared/types';

/**
 * Only requesters that have a bearer token with the signature
 * of a Service Token distributed from User Service have persmission.
 */
export function checkIfRequesterHasPermission(requester: ServiceToken): boolean {
    return (
        requester.SERVICE_KEY
        && (requester.SERVICE_KEY === process.env.USER_SERVICE_KEY)
    );
}
