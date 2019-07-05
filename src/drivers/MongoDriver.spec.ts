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

  describe('searchAllUsersObjects', () => {
    it('should return an array of working or released learning object summaries', async () => {
      expect.assertions(1);
      const query = {
        status: ['waiting', 'proofing'],
      };
      const username = stubs.user._username;
      const resultSet = await driver.searchAllUserObjects(query, username);

      expect(resultSet[0]).toBeDefined();
    });
  });

  describe('searchReleasedUserObjects', () => {
    it('should return an array of released learning object summaries', async () => {
      expect.assertions(1);
      const query = {
        text: '',
      };
      const username = stubs.user.username;
      const resultSet = await driver.searchReleasedUserObjects(query, username);

      expect(resultSet).toBeDefined();
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

  describe('getUserObjects', () => {
    it('The function should return an array of ids', async () => {
      expect.assertions(1);
      const ids = await driver.getUserObjects(stubs.user.username);
      expect(ids).toBeInstanceOf(Array);
    });
  });

  afterAll(() => driver.disconnect());
});
