import { MongoDriver } from '../drivers/MongoDriver';

describe('MongoDriver', () => {
  let driver: MongoDriver;

  beforeAll(async () => {
    driver = await MongoDriver.build(`${global['__MONGO_URI__']}`);
  });
  
  describe('getRecentChangelog', () => {
    
    it('The function should return the last element of the logs array', async () => {
        const learningObjectId = 'default_id';
        const changelog = await driver.fetchRecentChangelog(learningObjectId);
        expect(changelog).toEqual({
            _id: "5c3e2cab7da238008fcd771c",
            learningObjectId: "default_id",
            recentChangelog:
                {
                    userId:"5678",
                    date:"2019-01-15T18:55:39.000Z",
                    text:"hello two"
                }
        });
    });
  });

  describe('deleteChangelog', () => {
    
    it('The function should return void', async done => {
        const learningObjectId = '5ad8f5a6824dd17351adf1e1';
        const changelog = await driver.deleteChangelog(learningObjectId);
        expect(changelog).toBe(undefined);
        done();
    });
  });

  afterAll(() => {
    driver.disconnect();
    console.log('Disconnected from Database');
  });
});