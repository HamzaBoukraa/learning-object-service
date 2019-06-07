import { MongoDriver } from '../drivers/MongoDriver';
import { Stubs } from '../tests/stubs';

describe('MongoDriver', () => {
  let driver: MongoDriver;
  const stubs = new Stubs();

  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
  });

  describe('getRecentChangelog', () => {
    it('The function should return the last element of the logs array', async () => {
      return expect(driver.fetchRecentChangelog({
        learningObjectId: stubs.learningObject.id,
      }))
        .resolves.toEqual({...stubs.changelog, logs: [ stubs.changelog.logs[1] ]});
    });
  });

  describe('deleteChangelog', () => {
    it('The function should return void', async () => {
        const learningObjectId = 'default_id';
        return expect(driver.deleteChangelog({
          learningObjectId,
        }))
            .resolves.toBe(undefined);
    });
  });

  describe('createChangelog', () => {
    it('The function should return void', async () => {
        const learningObjectId = '5ad8f5a6824dd17351adf1e1';
        const author = {
          name: 'tester',
          userId: 'id',
          role: 'author',
          profileImage: 'image',
        };
        const changelogText = 'hello world';
        return expect(driver.createChangelog({learningObjectId, author, changelogText}))
           .resolves.toBe(undefined);
    });
  });

  afterAll(() => driver.disconnect());
});
