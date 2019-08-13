import { ServiceToken } from '../../../shared/types';
import { ResourceErrorReason, ResourceError } from '../../../shared/errors';

export async function createFileAccessIdentity(params: {
    username: string,
    fileAccessIdentity: string,
    requester: ServiceToken,
}): Promise<string> {
    checkIfRequesterHasPermission(params.requester);
    checkIfFileAccessIdentityExists(params.username);
    saveFileAccessIdentity({
        username: params.username,
        fileAccessIdentity: params.fileAccessIdentity,
    });
    const resourceURL = generateResourceURL(params.username);
    return resourceURL;
}

function checkIfRequesterHasPermission(requester: ServiceToken) {
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

function checkIfFileAccessIdentityExists(username: string) {

}

function saveFileAccessIdentity(params: {
    username: string,
    fileAccessIdentity: string,
}) {

}

function generateResourceURL(username: string) {
    return `${process.env.LEARNING_OBJECT_API}/file-access-identity/${username}`;
}
