import { FileAccessIdentites } from '../../..';
import { FileAccessIdentityDatastore } from '../../../shared/abstract-classes/FileAccessIdentityDatastore';

export namespace Datastores {
    export const fileAccessIdentity = () =>
        FileAccessIdentites.resolveDependency(FileAccessIdentityDatastore);
}
