import { FileAccessIdentities } from '../..';
import {
    FileAccessIdentityDatastore,
} from '../../shared/abstract-classes/FileAccessIdentityDatastore';
import {
    StubMongoDBFileAccessIdentityDatastore,
} from '../../gateways/FileAccessIdentityDatastore';
import { STUB_USERNAMES } from '../../shared/test-stubs';
import {
    getFileAccessIdentity,
} from './getFileAccessIdentity';

beforeAll(() => {
    FileAccessIdentities.providers = [
        {
            provide: FileAccessIdentityDatastore,
            useClass: StubMongoDBFileAccessIdentityDatastore,
        },
      ];
    FileAccessIdentities.initialize();
});

describe('When getFileAccessIdentity is called', () => {
    describe('and it is given a valid username', () => {
        it('should return a string', async () => {
            expect.assertions(1);

            const fileAccessIdentity = await getFileAccessIdentity(STUB_USERNAMES.correct);
            expect(typeof fileAccessIdentity).toBe('string');
        });
    });
    describe('and it is given an incorrect username', () => {
        it('should throw an error', async () => {
            expect.assertions(1);

            await expect(getFileAccessIdentity(STUB_USERNAMES.incorrect))
                .rejects
                .toThrowError();
        });
    });
});
