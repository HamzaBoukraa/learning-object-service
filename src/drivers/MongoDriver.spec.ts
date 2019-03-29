import { MongoDriver } from './MongoDriver';
import { LearningObject } from '../entity';

describe('MongoDriver', () => {
  let driver: MongoDriver;

  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
  });

  describe('searchAllObjects', () => {
    it('The function should return an object with total and objects', async () => {
      expect.assertions(1);
      const result = await driver.searchAllObjects({
        collection: ['nccp'],
      });
      expect(result).toBeDefined();
    });
  });

  describe('updateMultipleLearningObjects', () => {
    it('The function should return void', async () => {
      expect.assertions(1);
      const learningObjectId = '5ad8f5a6824dd17351adf1e1';
      await expect(
        driver.updateMultipleLearningObjects({
          ids: [learningObjectId],
          updates: { date: Date.now().toString() },
        }),
      ).resolves.toBe(undefined);
    });
  });

  describe('findParentObjectIds', () => {
    it('The function should return an array', async () => {
      expect.assertions(1);
      const learningObjectId = 'parent_object_1';
      const parents = await driver.findParentObjectIds({
      childId: learningObjectId,
      });
      expect(Array.isArray(parents)).toBe(true);
    });
  });

  describe('checkLearningObjectExistence', () => {
    it('The function should return an array', async () => {
      expect.assertions(1);
      const learningObjectId = 'parent_object_1';
      const result = await driver.checkLearningObjectExistence(
        learningObjectId,
      );
      console.log(result);
      expect(result.length).toBe(1);
    });
  });

  describe('getUserObjects', () => {
    it('The function should return an array of ids', async () => {
      expect.assertions(1);
      const username = 'mock_author_id';
      const ids = await driver.getUserObjects(username);
      expect(ids).toBeInstanceOf(Array);
    });
  });

  afterAll(() => {
    driver.disconnect();
    console.log('Disconnected from Database');
  });
});
