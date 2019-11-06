import { MongoDriver } from '../drivers/MongoDriver';
import { Stubs } from '../tests/stubs';

describe('MongoDriver', () => {
  let driver: MongoDriver;
  const stubs = new Stubs();

  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
  });

  describe('deleteChangelog', () => {
    it('The function should return void', async () => {
        const learningObjectId = 'default_id';
        return expect(driver.deleteChangelog({
          cuid: learningObjectId,
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
        return expect(driver.createChangelog({ cuid: learningObjectId, author, changelogText}))
          .resolves.toBe(undefined);
    });
  });

  afterAll(() => driver.disconnect());
});
