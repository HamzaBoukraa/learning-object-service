import { ElasticSearchDriver } from './ElasticSearchDriver';
import { PrivilegedLearningObjectSearchQuery,
         LearningObjectSearchResult,
         LearningObject,
         LearningObjectSearchQuery } from '../../typings';
import { LearningObjectDatastore } from '../../interfaces';


describe('ElasticSearchDriver', () => {
    let driver: LearningObjectDatastore = new ElasticSearchDriver;
    // describe('SearchReleasedObjects', () => {
    //     let params: LearningObjectSearchQuery;
    //     it('should return a set of learning objects found in the elastic search index', async (done) => {
    //         params = { text: 'intro to cyber' };
    //         const dataSet = await driver.searchReleasedObjects(params);
    //         console.log(dataSet.total);
    //         done();
    //     });
    //     it('should return a set of learning objects found in the elastic search index', async (done) => {
    //         params = { text: 'intro to cyber', collection: ['nccp'] };
    //         const dataSet = await driver.searchReleasedObjects(params);
    //         console.log(dataSet.total);
    //         done();
    //     });
    //     it('should return a set of objects filtered by collection and length', async (done) => {
    //         params = {
    //             text: 'intro to cyber',
    //             collection: ['nccp'],
    //             length: ['micromodule', 'module']
    //         }
    //         const dataSet = await driver.searchReleasedObjects(params);
    //         console.log(dataSet.total);
    //         done();
    //     });
    //     it('should return all objects in the index', async (done) => {
    //         params = {
    //             text: ' ',
    //             collection: ['nccp'],
    //             length: ['micromodule', 'module']
    //         }
    //         const dataSet = await driver.searchReleasedObjects(params);
    //         console.log(dataSet.total );
    //         done();
    //     });
    // });
    describe('searchAllObjects', () => {
        let params: PrivilegedLearningObjectSearchQuery;
        it('should return all objects in the index with collection access applied and normal filtering', async (done) => {
            params = {
                text: 'interger error',
                collection: ['nccp'],
                length: ['micromodule', 'module'],
                collectionRestrictions: {
                    nccp: [LearningObject.Status.RELEASED, LearningObject.Status.WAITING],
                    secinj: [LearningObject.Status.WAITING, LearningObject.Status.PROOFING],
                },
            };
            const dataSet = await driver.searchAllObjects(params);
            console.log(dataSet.total);
            done();
        });
        it('should return all objects in the index with normal filtering', async (done) => {
            params = {
                text: 'the',
                collection: ['nccp'],
                length: ['micromodule', 'module'],

            };
            const dataSet = await driver.searchAllObjects(params);
            console.log(dataSet.total);
            done();
        });
        it('should return all objects in the index with normal filtering', async (done) => {
            params = {
                text: 'the',
                length: ['micromodule', 'module'],
                collectionRestrictions: {
                    nccp: [LearningObject.Status.RELEASED, LearningObject.Status.WAITING],
                    secinj: [LearningObject.Status.WAITING, LearningObject.Status.PROOFING],
                },
            };
            const dataSet = await driver.searchAllObjects(params);
            console.log(dataSet.total);
            done();
        });
    })
});
