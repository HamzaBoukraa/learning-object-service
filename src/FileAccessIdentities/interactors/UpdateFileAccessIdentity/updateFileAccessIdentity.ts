import { ServiceToken } from '../../../shared/types';

import {
    checkIfFileAccessIdentityExists,
    generateResourceURL,
} from '../shared/functions';
import { Datastores } from '../shared/resolved-dependencies/Datastores';
import { FileAccessIdentityWriteParam } from '../shared/types/FileAccessIdentityWriteParam';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';

export async function updateFileAccessIdentity(
    param: FileAccessIdentityWriteParam,
) {
    const identityExists = await checkIfFileAccessIdentityExists(param.username);
    if (!identityExists) {
        throw new ResourceError(
            'File Access Identity not found',
            ResourceErrorReason.NOT_FOUND,
        );
    }

    applyUpdateToFileAccessIdentity({
        username: param.username,
        fileAccessIdentity: param.fileAccessIdentity,
    });

    const resourceURL = generateResourceURL(param.username);
    return resourceURL;
}

async function applyUpdateToFileAccessIdentity(params: {
    username: string,
    fileAccessIdentity: string,
}): Promise<void> {
    return Datastores
        .fileAccessIdentity()
        .updateFileAccessIdentity(params);
}

