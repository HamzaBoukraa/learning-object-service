import { ElasticSearchDriver } from './ElasticSearchDriver';
import { PrivilegedLearningObjectSearchQuery, LearningObjectSearchResult } from '../../typings';
import { LearningObjectDatastore } from '../../interfaces';


describe('ElasticSearchDriver', () => {
    let params: PrivilegedLearningObjectSearchQuery;
    let driver: LearningObjectDatastore = new ElasticSearchDriver;
    describe('SearchReleasedObjects', () => {
        it('should return an a set of learning objects found in the elastic search index', async (done) => {
            params = { text: 'intro to cyber' };
            const dataSet = await driver.searchReleasedObjects(params);
            console.log(dataSet);
            done();
            })
            it('should return a set of learning objects found in the elastic search index', async (done) => {
                params = { text: 'intro to cyber', collection: ['nccp'] };
                const dataSet = await driver.searchReleasedObjects(params);
                console.log(dataSet);
                done();
            });
            it('should return a set of objects filtered by collection and length', async (done)=>{
                params = {
                    text: 'intro to cyber',
                    collection: ['nccp'],
                    length: ['micromodule','module']}
                const dataSet = await driver.searchReleasedObjects(params);
                console.log(dataSet);
                done();
            })
            it('should return all objects in the index', async (done)=>{
                params = {
                    text: ' ',
                    collection: ['nccp'],
                    length: ['micromodule','module']}
                const dataSet = await driver.searchReleasedObjects(params);
                console.log(dataSet);
                done();
            })
        });
    });


