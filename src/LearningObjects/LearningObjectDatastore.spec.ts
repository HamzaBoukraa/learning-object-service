import { MongoDriver } from '../drivers//MongoDriver';

describe('MongoDriver', () => {
  let driver: MongoDriver;

  beforeAll(async () => {
    driver = new MongoDriver(`${global['__MONGO_URI__']}`);
  });
  
  describe('getRecentChangelog', () => {
    
    it('The function should return the last element of the logs array', async done => {
        const learningObjectId = '5ad8f5a6824dd17351adf1e1';
        const changelog = await driver.fetchRecentChangelog(learningObjectId);
        expect(changelog).toBe({
                userId:"1234",
                date:"2019-01-15T18:55:39.000Z",
                text:"hello two"
        });
        done();
    });
});

  afterAll(() => {
    driver.disconnect();
    console.log('Disconnected from Database');
  });
});