import { FileAccessIdentities } from '../../';
import {
    FileAccessIdentityDatastore,
} from '../../shared/abstract-classes/FileAccessIdentityDatastore';
import {
    StubMongoDBFileAccessIdentityDatastore,
} from '../../gateways/FileAccessIdentityDatastore';
import {
    FileAccessIdentitiesAdapter,
} from './FileAccessIdentitiesAdapter';
import { STUB_USERNAMES } from '../../shared/test-stubs';

let adapter: FileAccessIdentitiesAdapter;

beforeAll(() => {
    FileAccessIdentities.providers = [
        {
            provide: FileAccessIdentityDatastore,
            useClass: StubMongoDBFileAccessIdentityDatastore,
        },
      ];
    FileAccessIdentities.initialize();

    FileAccessIdentitiesAdapter.open();

    adapter = FileAccessIdentitiesAdapter.getInstance();
});

describe('When GetFileAccessIdentity is called', () => {
    describe('and it is given a valid username', () => {
        it('should return type string', async () => {
            expect.assertions(1);

            const fileAccessIdentity = await adapter.getFileAccessIdentity(STUB_USERNAMES.correct);
            expect(typeof fileAccessIdentity).toBe('string');
        });
    });
    describe('and it is given an invalid username', () => {
        it('should throw an Error', async () => {
            expect.assertions(1);

            await expect(adapter.getFileAccessIdentity(STUB_USERNAMES.incorrect))
                .rejects
                .toThrowError();
        });
    });
});


