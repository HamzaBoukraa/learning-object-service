import { FileAccessIdentities } from '../..';
import {
    FileAccessIdentityDatastore,
} from '../../shared/abstract-classes/FileAccessIdentityDatastore';
import {
    StubMongoDBFileAccessIdentityDatastore,
} from '../../gateways/FileAccessIdentityDatastore';
import { updateFileAccessIdentity } from './updateFileAccessIdentity';
import {
    STUB_USERNAMES,
    STUB_FILE_ACCESS_IDENTITIES,
} from '../../shared/test-stubs';
import {
    FileAccessIdentityWriteParam,
} from '../shared/types/FileAccessIdentityWriteParam';

beforeAll(() => {
    FileAccessIdentities.providers = [
        {
            provide: FileAccessIdentityDatastore,
            useClass: StubMongoDBFileAccessIdentityDatastore,
        },
      ];
    FileAccessIdentities.initialize();
});

describe('When updateFileAccessIdentity is called', () => {
    describe('and it is given a valid username', () => {
        it('should return a string', async () => {
            expect.assertions(1);

            const params: FileAccessIdentityWriteParam = {
                username: STUB_USERNAMES.correct,
                fileAccessIdentity: STUB_FILE_ACCESS_IDENTITIES.valid,
            };

            const fileAccessIdentity = await updateFileAccessIdentity(params);
            expect(typeof fileAccessIdentity).toBe('string');
        });
    });
    describe('and it is given an incorrect username', () => {
        it('should throw an error', async () => {
            expect.assertions(1);

            const params: FileAccessIdentityWriteParam = {
                username: STUB_USERNAMES.incorrect,
                fileAccessIdentity: STUB_FILE_ACCESS_IDENTITIES.valid,
            };

            await expect(updateFileAccessIdentity(params))
                .rejects
                .toThrowError();
        });
    });
});
