import { MongoDriver } from '../drivers/MongoDriver';

describe('MongoDriver', () => {
  let driver: MongoDriver;

  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
  });

  describe('getRecentChangelog', () => {
    it('The function should return the last element of the logs array', async () => {
      const learningObjectId = 'default_id';
      return expect(driver.fetchRecentChangelog({
        learningObjectId,
      }))
        .resolves.toEqual({
          _id: '5c3e2cab7da238008fcd771c',
          learningObjectId: 'default_id',
          logs: [
              {
                  userId: '5678',
                  date: '2019-01-15T18:55:39.000Z',
                  text: 'hello two',
              },
            ],
        });
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
