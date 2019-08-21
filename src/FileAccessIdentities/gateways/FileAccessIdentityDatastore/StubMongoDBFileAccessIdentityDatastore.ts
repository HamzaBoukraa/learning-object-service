import { FileAccessIdentityDatastore } from '../../shared/abstract-classes/FileAccessIdentityDatastore';
import {
    STUB_USERNAMES,
    STUB_FILE_ACCESS_IDENTITIES,
} from '../../shared/test-stubs';
import { ResourceError, ResourceErrorReason } from '../../../shared/errors';

export class StubMongoDBFileAccessIdentityDatastore
implements FileAccessIdentityDatastore {

    insertFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string;
        fileAccessIdentity: string;
    }): Promise<void> {
        return Promise.resolve();
    }

    async findFileAccessIdentity(username: string): Promise<string | Error> {
        if (username === STUB_USERNAMES.correct) {
            return STUB_FILE_ACCESS_IDENTITIES.valid;
        }
        return new ResourceError('not found', ResourceErrorReason.NOT_FOUND);
    }

    updateFileAccessIdentity({
        username,
        fileAccessIdentity,
    }: {
        username: string;
        fileAccessIdentity: string;
    }): Promise<void> {
        return Promise.resolve();
    }
}
