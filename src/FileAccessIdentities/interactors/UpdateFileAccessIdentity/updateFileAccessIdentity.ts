import { ServiceToken } from '../../../shared/types';

import {
    checkIfFileAccessIdentityExists,
    generateResourceURL,
} from '../shared/functions';
import { Datastores } from '../shared/resolved-dependencies/Datastores';
import { FileAccessIdentityWriteParam } from '../shared/types/FileAccessIdentityWriteParam';

export async function updateFileAccessIdentity(
    param: FileAccessIdentityWriteParam,
) {
    checkIfFileAccessIdentityExists(param.username);
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

