import { ElasticSearchDriver } from './ElasticSearchDriver';
import { PrivilegedLearningObjectSearchQuery, LearningObjectSearchResult, LearningObject } from '../../typings';
import { LearningObjectDatastore } from '../../interfaces';


describe('ElasticSearchDriver', () => {
    let params: PrivilegedLearningObjectSearchQuery;
    let driver: LearningObjectDatastore = new ElasticSearchDriver;
    describe('SearchReleasedObjects', () => {
        it('should return a set of learning objects found in the elastic search index', async (done) => {
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
        it('should return a set of objects filtered by collection and length', async (done) => {
            params = {
                text: 'intro to cyber',
                collection: ['nccp'],
                length: ['micromodule', 'module']
            }
            const dataSet = await driver.searchReleasedObjects(params);
            console.log(dataSet);
            done();
        })
        it('should return all objects in the index', async (done) => {
            params = {
                text: ' ',
                collection: ['nccp'],
                length: ['micromodule', 'module']
            }
            const dataSet = await driver.searchReleasedObjects(params);
            console.log(dataSet);
            done();
        });
        it('should return all objects in the index with query restrictions applied and normal filtering', async (done) => {
            params = {
                text: 'interger error',
                collection: ['nccp'],
                length: ['micromodule', 'module'],
                collectionRestrictions: {
                    nccp: [LearningObject.Status.RELEASED, LearningObject.Status.WAITING],
                    secinj: [LearningObject.Status.WAITING, LearningObject.Status.PROOFING],
                },
            };
            const dataSet = await driver.searchReleasedObjects(params);
            console.log(dataSet);
            done();
        });
    });
});
