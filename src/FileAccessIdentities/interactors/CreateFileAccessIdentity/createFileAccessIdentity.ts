import { Datastores } from '../shared/resolved-dependencies/Datastores';
import {
    checkIfFileAccessIdentityExists,
    generateResourceURL,
} from '../shared/functions';
import { FileAccessIdentityWriteParam } from '../shared/types/FileAccessIdentityWriteParam';

export async function createFileAccessIdentity(
    param: FileAccessIdentityWriteParam,
): Promise<string> {
    checkIfFileAccessIdentityExists(param.username);
    saveFileAccessIdentity({
        username: param.username,
        fileAccessIdentity: param.fileAccessIdentity,
    });
    const resourceURL = generateResourceURL(param.username);
    return resourceURL;
}


function saveFileAccessIdentity(params: {
    username: string,
    fileAccessIdentity: string,
}) {
    Datastores.fileAccessIdentity().insertFileAccessIdentity(params);
}
