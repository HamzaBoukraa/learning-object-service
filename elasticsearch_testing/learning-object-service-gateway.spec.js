import LearningObjectServiceGateway from './learning-object-service-gateway';
import { initElasticsearchNode, destroyElasticsearchIndex } from './elasticsearch_gateway';
import { expectedResponse } from './elasticsearch-data/elasticsearch-response';

describe('Sends a request to the learning object service search route', () => {
    let learningObjectService;

    beforeAll(async () => {
        learningObjectService = new LearningObjectServiceGateway();
        await initElasticsearchNode();
    });

    it('Search as a user/visitor', () => {
        expect.assertions(1);
        return expect(learningObjectService.searchLearningObjects('', 'user/visitor')).resolves.toEqual(expectedResponse);    
    });

    // it('Search as a reviewer@nccp', () => {
    //     expect.assertions(1);
    //     return expect(learningObjectService.searchLearningObjects('')).resolves.toEqual(expectedResponse);    
    // });

    // it('Search as a curator@c5', () => {
    //     expect.assertions(1);
    //     return expect(learningObjectService.searchLearningObjects('')).resolves.toEqual(expectedResponse);    
    // });

    // it('Search as an editor', () => {
    //     expect.assertions(1);
    //     return expect(learningObjectService.searchLearningObjects('')).resolves.toEqual(expectedResponse);    
    // });

    // it('Search as an admin', () => {
    //     expect.assertions(1);
    //     return expect(learningObjectService.searchLearningObjects('')).resolves.toEqual(expectedResponse);    
    // });

    afterAll(async () => {
        await destroyElasticsearchIndex();
    });
});
