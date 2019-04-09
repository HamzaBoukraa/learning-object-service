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
        conditions: [{ nccp: [LearningObject.Status.RELEASED] }],
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
      const learningObjectId = 'default_id';
      const parents = await driver.findParentObjectIds({
        childId: learningObjectId,
      });
      expect(Array.isArray(parents)).toBe(true);
    });
  });

  describe('checkLearningObjectExistence', () => {
    it('The function should return an array', async () => {
      expect.assertions(1);
      const learningObjectId = 'default_id';
      const userId = '5b967621f7a3ce2f6cbf5ba1';
      const result = await driver.checkLearningObjectExistence({
        learningObjectId,
        userId,
      });
      expect(result).toBeTruthy();
    });
  });

  describe('getUserObjects', () => {
    it('The function should return an array of ids', async () => {
      expect.assertions(1);

      const username = 'unittester';
      const ids = await driver.getUserObjects(username);
      expect(ids).toEqual([ 'default_id' ]);
    });
  });

  afterAll(() => {
    driver.disconnect();
    console.log('Disconnected from Database');
  });
});
