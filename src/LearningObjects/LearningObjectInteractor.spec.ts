import { DataStore } from '../shared/interfaces/DataStore';
import { MockDataStore } from '../tests/mock-drivers/MockDataStore';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import {
  LearningObjectWithChildren,
  LearningObjectWithoutChildren,
} from '../tests/interfaces';
import {
  updateObjectLastModifiedDate,
  updateParentsDate,
  getLearningObjectChildrenById,
  getLearningObjectById,
  generateReleasableLearningObject,
} from './LearningObjectInteractor';
import { Stubs } from '../tests/stubs';
import { LibraryCommunicator } from '../shared/interfaces/interfaces';
import { HierarchicalLearningObject } from '../shared/entity';
import { LearningObjectsModule } from './LearningObjectsModule';
import { FileMetadataGateway, FileManagerGateway, ReadMeBuilder } from './interfaces';
import { UserGateway } from './interfaces/UserGateway';
import {StubFileMetadataGateway} from './gateways/FileMetadataGateway/StubFileMetadataGateway'
import {StubFileManagerGateway} from './gateways/FileManagerGateway/StubFileManagerGateway'
import {StubUserGateway} from './gateways/UserGateway/StubUserGateway'
import {StubReadMeBuilder} from './drivers/ReadMeBuilder/StubReadMeBuilder';


const dataStore: DataStore = new MockDataStore();
const library: LibraryCommunicator = new MockLibraryDriver();
const stubs = new Stubs();

describe('Interactor: LearningObjectInteractor', () => {
  beforeAll(() => {
    LearningObjectsModule.providers = [
      { provide: FileMetadataGateway, useClass: StubFileMetadataGateway },
      { provide: FileManagerGateway, useClass: StubFileManagerGateway },
      { provide: ReadMeBuilder, useClass: StubReadMeBuilder },
      { provide: UserGateway, useClass: StubUserGateway },
    ]
    LearningObjectsModule.initialize();
  });
  afterAll(() => {
    LearningObjectsModule.destroy();
  });

  it(`should update an object's last modified date and recursively update the child's parents' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      updateObjectLastModifiedDate({
        dataStore,
        id: stubs.learningObject.id,
      }),
    ).resolves.toBe(undefined);
  });
  it(`should recursively update parent objects' last modified date`, async () => {
    expect.assertions(1);
    await expect(
      updateParentsDate({
        dataStore,
        childId: stubs.learningObject.id,
        date: Date.now().toString(),
      }),
    ).resolves.toBe(undefined);
  });
  it(`should get object's children`, async () => {
    expect.assertions(1);
    await expect(
      getLearningObjectChildrenById(dataStore, stubs.learningObject.id),
    ).resolves.toEqual([]);
  });
  it('should get a learning object by Id', async () => {
    expect.assertions(1);
    const learningObject = await getLearningObjectById({
      dataStore,
      id: stubs.learningObject.id,
      library,
    });
    learningObject.children.length
      ? expect(learningObject).toMatchObject(LearningObjectWithChildren)
      : expect(learningObject).toMatchObject(LearningObjectWithoutChildren);
  });
  it('should generate a Learning Object with it\'s full heirarchy present', async () => {
    try {
      const learningObject = await generateReleasableLearningObject({
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
