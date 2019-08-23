import { FileAccessIdentities } from '../..';
import {
    FileAccessIdentityDatastore,
} from '../../shared/abstract-classes/FileAccessIdentityDatastore';
import {
    StubMongoDBFileAccessIdentityDatastore,
} from '../../gateways/FileAccessIdentityDatastore';
import { createFileAccessIdentity } from './createFileAccessIdentity';
import { FileAccessIdentityWriteParam } from '../shared/types/FileAccessIdentityWriteParam';
import {
    STUB_USERNAMES,
    STUB_FILE_ACCESS_IDENTITIES,
} from '../../shared/test-stubs';

beforeAll(() => {
    FileAccessIdentities.providers = [
        {
            provide: FileAccessIdentityDatastore,
            useClass: StubMongoDBFileAccessIdentityDatastore,
        },
      ];
    FileAccessIdentities.initialize();
});

describe('When createFileAccessIdentity is called', () => {
    describe('and it is given a username that already exists', () => {
        it('should throw an error', async () => {
            expect.assertions(1);

            const params: FileAccessIdentityWriteParam = {
                username: STUB_USERNAMES.correct,
                fileAccessIdentity: STUB_FILE_ACCESS_IDENTITIES.valid,
            };

            await expect(createFileAccessIdentity(params))
                .rejects
                .toThrowError();
        });
    });
    describe('and it is given a new username', () => {
        it('should return a string', async () => {
            expect.assertions(1);

            const params: FileAccessIdentityWriteParam = {
                username: STUB_USERNAMES.incorrect,
                fileAccessIdentity: STUB_FILE_ACCESS_IDENTITIES.valid,
            };

            const resourceURL = await createFileAccessIdentity(params);
            expect(typeof resourceURL).toBe('string');
        });
    });
});
