import { DataStore } from '../shared/interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import {
  LearningObjectWithChildren,
  LearningObjectWithoutChildren,
} from '../tests/interfaces';
import { Stubs } from '../tests/stubs';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import { HierarchicalLearningObject } from '../shared/entity';
import { LearningObjectsModule } from './LearningObjectsModule';
import {
  FileMetadataGateway,
  FileManagerGateway,
  ReadMeBuilder,
} from './interfaces';
import { UserGateway } from './interfaces/UserGateway';
import { StubFileMetadataGateway } from './gateways/FileMetadataGateway/StubFileMetadataGateway';
import { StubFileManagerGateway } from './gateways/FileManagerGateway/StubFileManagerGateway';
import { StubUserGateway } from './gateways/UserGateway/StubUserGateway';
import { StubReadMeBuilder } from './drivers/ReadMeBuilder/StubReadMeBuilder';
import { mapLearningObjectToSummary } from '../shared/functions';
import { UserToken } from '../shared/types';
let dataStore: DataStore = new MockDataStore();
const library: LibraryCommunicator = new MockLibraryDriver();
const stubs = new Stubs();

let interactor: any;

const localDatastore = new MockDataStore();

jest.mock('../shared/MongoDB/HelperFunctions');

describe('Interactor: LearningObjectInteractor', () => {
  beforeAll(async () => {
    LearningObjectsModule.providers = [
      { provide: FileMetadataGateway, useClass: StubFileMetadataGateway },
      { provide: FileManagerGateway, useClass: StubFileManagerGateway },
      { provide: ReadMeBuilder, useClass: StubReadMeBuilder },
      { provide: UserGateway, useClass: StubUserGateway },
    ];
    LearningObjectsModule.initialize();

    interactor = await import('./LearningObjectInteractor');
  });
  afterAll(() => {
    LearningObjectsModule.destroy();
  });

  // tslint:disable-next-line: no-require-imports
  const index = require.requireActual('./LearningObjectInteractor');

  it(`should update an object's last modified date and recursively update the child's parents' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      interactor.updateObjectLastModifiedDate({
        dataStore,
        id: stubs.learningObject.id,
      }),
    ).resolves.toBe(undefined);
  });
  it(`should recursively update parent objects' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      interactor.updateParentsDate({
        dataStore,
        childId: stubs.learningObject.id,
        date: Date.now().toString(),
      }),
    ).resolves.toBe(undefined);
  });
  it('should get a learning object by Id', async () => {
    index.loadChildrenSummaries = jest
      .fn()
      .mockResolvedValue([stubs.learningObject]);
    expect.assertions(1);
    const learningObject = await index.getLearningObjectById({
      dataStore: localDatastore,
      id: localDatastore.stubs.learningObject.id,
      library,
    });
    expect(learningObject).toEqual(localDatastore.stubs.learningObject);
  });
  it('should get a Learning Object Summary by Id', async () => {
    expect.assertions(1);
    const learningObject = await interactor.getLearningObjectSummaryById({
      dataStore: localDatastore,
      id: localDatastore.stubs.learningObject.id,
    });
    expect(learningObject).toEqual(
      mapLearningObjectToSummary(localDatastore.stubs.learningObject),
    );
  });
  // tslint:disable-next-line: quotemark
  it("should generate a Learning Object with it's full heirarchy present", async () => {
    try {
      const learningObject = await interactor.generateReleasableLearningObject({
        dataStore,
        id: stubs.learningObject.id,
        requester: stubs.userToken,
      });
      testHiearchy(learningObject);
    } catch (error) {
      fail();
    }
  });
});

function testHiearchy(object: HierarchicalLearningObject) {
  const children = object.children;
  object.children = [];
  expect(object).toMatchObject(LearningObjectWithoutChildren);
  children.map(child => testHiearchy(child));
}
