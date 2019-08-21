import { Datastores } from '../shared/resolved-dependencies/Datastores';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';

export async function getFileAccessIdentity(username: string): Promise<string> {
    const fileAccessIdentity = await queryFileAccessIdentity(username);
    if (fileAccessIdentity instanceof Error) {
        throw new ResourceError(
            'File Access Identity was not found',
            ResourceErrorReason.NOT_FOUND,
        );
    }

    return fileAccessIdentity;
}

function queryFileAccessIdentity(username: string): Promise<string | Error> {
    return Datastores.fileAccessIdentity().findFileAccessIdentity(username);
}
