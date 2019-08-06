import { getLearningObjectRevision } from './getLearningObjectRevision';
import { DataStore } from '../../../shared/interfaces/DataStore';
import { MockDataStore } from '../../../tests/mock-drivers/MockDataStore';
import { Stubs } from '../../../tests/stubs';
import { LearningObjectsModule } from '../../LearningObjectsModule';
import { StubUserGateway } from '../../gateways/UserGateway/StubUserGateway';
import { UserGateway } from '../../interfaces/UserGateway';

const dataStore: DataStore = new MockDataStore();
const stubs = new Stubs();
beforeAll(() => {
  LearningObjectsModule.providers = [
    { provide: UserGateway, useClass: StubUserGateway },
  ];
  LearningObjectsModule.initialize();
});
describe('Given a summary param of false', () => {
  it('Should return a revision of type LearningObject', async () => {
    await expect(getLearningObjectRevision({
      dataStore,
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
    await expect(getLearningObjectRevision({
      dataStore,
      requester: stubs.userToken,
      learningObjectId: stubs.learningObject.id,
      revisionId: 1,
      username: stubs.user.username,
      summary: true,
    }))
      .resolves.not.toHaveProperty('materials');
  });
});