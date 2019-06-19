import { searchLearningObjects } from './learning-object-service-gateway';
import { initElasticsearchNode } from './elasticsearch_gateway';
import { expectedVisitorResponse } from './elasticsearch-data/elasticsearch-response-visitor';
import 'dotenv/config';

describe('Sends a request to the learning object service search route', () => {

    beforeAll(async () => {
        await initElasticsearchNode();
    });

    it('Search as a user/visitor', () => {
        expect.assertions(1);
        return expect(searchLearningObjects('', 'user/visitor'))
            .resolves
            .toEqual(expectedVisitorResponse);    
    });

    it('Search as a reviewer@nccp', () => {
        expect.assertions(1);
        return expect(searchLearningObjects('', 'reviewer@nccp'))
            .resolves
            .toEqual({
                total: 6,
                objects: [],
            });    
    });

    it('Search as a curator@c5', () => {
        expect.assertions(1);
        return expect(searchLearningObjects('', 'curator@c5'))
            .resolves
            .toEqual({
                total: 6,
                objects: [],
            });    
    });

    it('Search as an editor', () => {
        expect.assertions(1);
        return expect(searchLearningObjects('', 'editor'))
            .resolves
            .toEqual({
                total: 10,
                objects: [],
            });   
    });

    it('Search as an admin', async () => {
        expect.assertions(1);
        return expect(searchLearningObjects('', 'admin'))
            .resolves
            .toEqual({
                total: 10,
                objects: [],
            });    
    });

});
