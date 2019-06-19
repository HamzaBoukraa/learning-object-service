import { searchLearningObjects } from './learning-object-service-gateway';
import { initElasticsearchNode } from './elasticsearch_gateway';
import { expectedVisitorResponse, expectedEditorAdminResponse } from '../elasticsearch-data/elasticsearch-responses';
import 'dotenv/config';

describe('Sends a request to the learning object service search route', () => {

    beforeAll(async () => {
        await initElasticsearchNode();
    });

    it('Search as a user/visitor', async () => {
        expect.assertions(2);
        const results = await searchLearningObjects('', 'user/visitor');
        expect(results.total).toBe(expectedVisitorResponse.total);
        expect(new Set(results.objects)).toEqual(new Set(expectedVisitorResponse.objects));    
    });

    // FIXME: Uncomment when elasticsearch query fix is merged
    // it('Search as a reviewer@nccp', () => {
    //     expect.assertions(1);
    //     return expect(searchLearningObjects('', 'reviewer@nccp'))
    //         .resolves
    //         .toEqual({
    //             total: 6,
    //             objects: [],
    //         });    
    // });

    // FIXME: Uncomment when elasticsearch query fix is merged
    // it('Search as a curator@c5', () => {
    //     expect.assertions(1);
    //     return expect(searchLearningObjects('', 'curator@c5'))
    //         .resolves
    //         .toEqual({
    //             total: 6,
    //             objects: [],
    //         });    
    // });

    it('Search as an editor', async () => {
        expect.assertions(2);
        const results = await searchLearningObjects('', 'editor');
        expect(results.total).toBe(expectedEditorAdminResponse.total);
        expect(new Set(results.objects)).toEqual(new Set(expectedEditorAdminResponse.objects));    
    });

    it('Search as an admin', async () => {
        expect.assertions(2);
        const results = await searchLearningObjects('', 'admin');
        expect(results.total).toBe(expectedEditorAdminResponse.total);
        expect(new Set(results.objects)).toEqual(new Set(expectedEditorAdminResponse.objects));    
    });
});
