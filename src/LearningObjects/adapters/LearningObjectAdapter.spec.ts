import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { DataStore } from '../../shared/interfaces/DataStore';
import { Stubs } from '../../tests/stubs';
import { LearningObjectAdapter } from './LearningObjectAdapter';
import { LibraryCommunicator } from '../../shared/interfaces/interfaces';
import { MockLibraryDriver } from '../../tests/mock-drivers/MockLibraryDriver';
import { LearningObjectsModule } from '../LearningObjectsModule';
import { UserGateway } from '../interfaces/UserGateway';
import { StubUserGateway } from '../gateways/UserGateway/StubUserGateway';

const dataStore: DataStore = new MockDataStore();
const library: LibraryCommunicator = new MockLibraryDriver();
const stubs = new Stubs();

describe('getLearningObjectRevision function', () => {
    beforeAll(() => {
        LearningObjectsModule.providers = [{ provide: UserGateway, useClass: StubUserGateway }];
        LearningObjectsModule.initialize();
        LearningObjectAdapter.open(dataStore, library);
    });
    describe('Given a summary param of false', () => {
        it('Should return a revision of type LearningObject', async () => {
            await expect(LearningObjectAdapter.getInstance().getLearningObjectRevision({
                requester: stubs.userToken,
                learningObjectId: stubs.learningObject.id,
                revisionId: 1,
                username: stubs.user.username,
                summary: false,
            }))
            .resolves.toHaveProperty('materials');
        });
    });
    describe('Given a summary param of true', () => {
        it('Should return a revision of type LearningObjectSummary', async () => {
            await expect(LearningObjectAdapter.getInstance().getLearningObjectRevision({
                requester: stubs.userToken,
                learningObjectId: stubs.learningObject.id,
                revisionId: 1,
                username: stubs.user.username,
                summary: true,
            }))
            .resolves.not.toHaveProperty('materials');
        });
    });
});
