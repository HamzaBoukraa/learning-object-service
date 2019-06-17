import ElasticSearchService from './elasticsearch-service';
import * as Pact from '@pact-foundation/pact';
import searchInteraction from './interactions';

describe('searchLearningObjects()', () => {

    beforeAll((done) => {
        global.provider.setup().then(() => done());
    }, 10000);
    
    beforeEach((done) => {

        const contentTypeMatcher = Pact.Matchers.term({
            matcher: "application\\/json; *charset=utf-8",
            generate: "application/json; charset=utf-8"
        });

        global.provider.addInteraction(searchInteraction)
            .then(() => done());
    }, 5000);

    it('Sends a request to the learning object service search route', (done) => {
        const ess = new ElasticSearchService();
        ess.searchLearningObjects('nsa')
            .then(response => {
                expect(response)
            })
            .then(() => {
                global.provider.verify()
                    .then(() => done(), error => {
                        done.fail(error);
                    })
            })
            .catch((e) => {
                console.error(e);
            });
    }, 5000);

    afterAll((done) => {
       // global.provider.finalize().then(() => done());
    });
});
