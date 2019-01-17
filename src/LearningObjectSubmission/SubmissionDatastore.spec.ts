import { MongoDriver } from '../drivers//MongoDriver';

describe('MongoDriver', () => {
  let driver: MongoDriver;

  beforeAll(async () => {
    driver = await MongoDriver.build(`${global['__MONGO_URI__']}`);
  });
  
  describe('createChangelog', () => {
    
    it('The function should return void', async done => {
        const learningObjectId = '5ad8f5a6824dd17351adf1e1';
        const userID = '12356';
        const text = 'hello world'
        const changelog = await driver.createChangelog(learningObjectId, userID, text);
        expect(changelog).toBe(undefined);
        done();
    });
  });

  afterAll(() => {
    driver.disconnect();
    console.log('Disconnected from Database');
  });
});