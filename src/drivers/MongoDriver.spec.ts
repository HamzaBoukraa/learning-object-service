import { MongoDriver } from './MongoDriver';
import { Stubs } from '../tests/stubs';

describe('MongoDriver', () => {
  let driver: MongoDriver;
  let stubs = new Stubs();

  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
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

  describe('getUserObjects', () => {
    it('The function should return an array of ids', async () => {
      expect.assertions(1);
      const ids = await driver.getUserObjects(stubs.user.username);
      expect(ids).toBeInstanceOf(Array);
    });
  });

  afterAll(() => driver.disconnect());
});
