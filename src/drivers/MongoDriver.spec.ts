import { MongoDriver } from './MongoDriver';
import { Stubs } from '../tests/stubs';

describe('MongoDriver', () => {
  let driver: MongoDriver;
  let stubs = new Stubs();

  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
  });

  describe('searchAllObjects', () => {
    it('The function should return an object with total and objects', async () => {
      expect.assertions(1);
      const result = await driver.searchAllObjects({
        collection: [stubs.collection.name],
      });
      expect(result).toBeDefined();
    });
  });

  describe('updateMultipleLearningObjects', () => {
    it('The function should return void', async () => {
      expect.assertions(1);
      await expect(
        driver.updateMultipleLearningObjects({
          ids: [stubs.learningObject.id],
          updates: { date: Date.now().toString() },
        }),
      ).resolves.toBe(undefined);
    });
  });

  describe('findParentObjectIds', () => {
    it('The function should return an array', async () => {
      expect.assertions(1);
      const parents = await driver.findParentObjectIds({
        childId: stubs.learningObjectChild.id,
      });
      expect(Array.isArray(parents)).toBe(true);
    });
  });

  describe('checkLearningObjectExistence', () => {
    it('The function should return an array', async () => {
      expect.assertions(1);
      const result = await driver.checkLearningObjectExistence({
        learningObjectId: stubs.learningObject.id,
        userId: stubs.learningObject.author.id,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('getUserObjects', () => {
    it('The function should return an array of ids', async () => {
      expect.assertions(1);
      const ids = await driver.getUserObjects(stubs.user.username);
      expect(ids).toBeInstanceOf(Array);
    });
  });

  afterAll(() => driver.disconnect());
});
