import { Datastores } from '../../resolved-dependencies/Datastores';
import { ResourceError, ResourceErrorReason } from '../../../../../shared/errors';

export async function checkIfFileAccessIdentityExists(username: string): Promise<boolean> {
    const fileAccessIdentity = await Datastores.fileAccessIdentity().findFileAccessIdentity(username);
    if (fileAccessIdentity) {
        return true;
    }
    return false;
}
