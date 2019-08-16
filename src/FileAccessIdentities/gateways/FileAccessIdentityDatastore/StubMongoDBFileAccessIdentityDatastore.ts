import { FileAccessIdentityDatastore } from '../../shared/abstract-classes/FileAccessIdentityDatastore';
import {
    STUB_USERNAMES,
    STUB_FILE_ACCESS_IDENTITIES,
} from '../../shared/test-stubs';

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

    async findFileAccessIdentity(username: string): Promise<string> {
        if (username === STUB_USERNAMES.correct) {
            return STUB_FILE_ACCESS_IDENTITIES.valid;
        }
        return null;
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
