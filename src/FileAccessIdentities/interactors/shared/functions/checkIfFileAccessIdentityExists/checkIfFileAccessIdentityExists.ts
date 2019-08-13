import { Datastores } from '../../resolved-dependencies/Datastores';
import { ResourceError, ResourceErrorReason } from '../../../../../shared/errors';

export async function checkIfFileAccessIdentityExists(username: string) {
    const fileAccessIdentity = await Datastores.fileAccessIdentity().findFileAccessIdentity(username);
    if (!fileAccessIdentity) {
        throw new ResourceError(
            'File Access Identity not found',
            ResourceErrorReason.NOT_FOUND,
        );
    }
}
