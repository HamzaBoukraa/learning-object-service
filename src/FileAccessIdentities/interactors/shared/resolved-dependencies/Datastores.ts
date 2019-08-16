import { FileAccessIdentities } from '../../..';
import { FileAccessIdentityDatastore } from '../../../shared/abstract-classes/FileAccessIdentityDatastore';

export namespace Datastores {
    export const fileAccessIdentity = () =>
        FileAccessIdentities.resolveDependency(FileAccessIdentityDatastore);
}
