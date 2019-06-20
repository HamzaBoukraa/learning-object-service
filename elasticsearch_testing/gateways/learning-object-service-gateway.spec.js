import { searchLearningObjects } from './learning-object-service-gateway';
import { initElasticsearchNode } from './elasticsearch_gateway';
import { 
    expectedVisitorResponse,
    expectedEditorAdminResponse,
    expectedReviewerNCCPResponse,
    expectedCuratorC5Response,
} from '../elasticsearch-data/elasticsearch-responses';
import 'dotenv/config';

describe('Sends a request to the Learning Object service search route', () => {

    beforeAll(async () => {
        await initElasticsearchNode();
    });

    describe('as a user/visitor', () => {
        it('Make sure response only contains released objects', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', '');
            expect(results.total).toBe(expectedVisitorResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedVisitorResponse.objects));    
        });
    });

    describe('as a reviewer@nccp', () => {
        it('Make sure response contains submitted objects in nccp collection', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'reviewer@nccp');
            expect(results.total).toBe(expectedReviewerNCCPResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedReviewerNCCPResponse.objects)); 
        });
    });

    describe('as a curator@c5', () => {
        it('Make sure response contains submitted objects in c5 collection', () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'reviewer@nccp');
            expect(results.total).toBe(expectedCuratorC5Response.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedCuratorC5Response.objects));  
        });
    });

    describe('as an editor', () => {
        it('Ensure all objects are returned', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'editor');
            expect(results.total).toBe(expectedEditorAdminResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedEditorAdminResponse.objects));    
        });
    });

    describe('as an admin', () => {
        it('Ensure all objects are returned', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'admin');
            expect(results.total).toBe(expectedEditorAdminResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedEditorAdminResponse.objects));    
        });
    });
});
