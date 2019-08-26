import { Datastores } from '../shared/resolved-dependencies/Datastores';
import {
    checkIfFileAccessIdentityExists,
    generateResourceURL,
} from '../shared/functions';
import { FileAccessIdentityWriteParam } from '../shared/types/FileAccessIdentityWriteParam';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';

export async function createFileAccessIdentity(
    param: FileAccessIdentityWriteParam,
): Promise<string> {
    const identityExists = await checkIfFileAccessIdentityExists(param.username);
    if (identityExists) {
        throw new ResourceError(
            'File Access Identity already exists',
            ResourceErrorReason.BAD_REQUEST,
        );
    }

    saveFileAccessIdentity(param);

    const resourceURL = generateResourceURL(param.username);
    return resourceURL;
}


function saveFileAccessIdentity(param: FileAccessIdentityWriteParam) {
    Datastores.fileAccessIdentity().insertFileAccessIdentity(param);
}
