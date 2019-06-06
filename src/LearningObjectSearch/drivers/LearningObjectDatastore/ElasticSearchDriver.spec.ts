import { ElasticSearchDriver } from './ElasticSearchDriver';
import { PrivilegedLearningObjectSearchQuery, LearningObjectSearchResult } from '../../typings';
import { LearningObjectDatastore } from '../../interfaces';


describe('ElasticSearchDriver', () => {
    let params: PrivilegedLearningObjectSearchQuery;
    let driver: LearningObjectDatastore = new ElasticSearchDriver;
    describe('SearchReleasedObjects', () => {
        it('should return an a set of learning objects found in the elastic search index', async (done) => {
            params = { text: 'intro' };
            const dataSet = await driver.searchReleasedObjects(params);
            console.log(dataSet);
            done();
        });
        it('should return a set of learning objects found in the elastic search index', async (done) => {
            params = { text: 'intro', collection: ['nccp'] };
            const dataSet = await driver.searchReleasedObjects(params);
            console.log(dataSet);
            done();
        });
    });
});

