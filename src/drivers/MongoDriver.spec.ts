import { MongoDriver } from './MongoDriver';

describe('MongoDriver', () => {
  let driver: MongoDriver;

  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
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
      const result = await driver.checkLearningObjectExistence(learningObjectId);
      expect(result.length).toBe(1);
    });
  });

  afterAll(() => {
    driver.disconnect();
    console.log('Disconnected from Database');
  });
});
