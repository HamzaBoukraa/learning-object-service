import { searchLearningObjects } from './learning-object-service-gateway';
import { initElasticsearchNode } from './elasticsearch_gateway';
import { 
    expectedVisitorResponse,
    expectedEditorAdminResponse,
    expectedReviewerNCCPResponse,
    expectedCuratorC5Response,
} from '../elasticsearch-data/elasticsearch-responses';
import 'dotenv/config';

describe('Learning Object Service search', () => {

    beforeAll(async () => {
        await initElasticsearchNode();
    });

    describe('a user with the privilege of user or visitor', () => {
        it('should respond with only released objects', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', '');
            expect(results.total).toBe(expectedVisitorResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedVisitorResponse.objects));    
        });
    });

    describe('a user with the privilege of reviewer@nccp', () => {
        it('should respond with released objects and submissions to the nccp collection', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'reviewer@nccp');
            expect(results.total).toBe(expectedReviewerNCCPResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedReviewerNCCPResponse.objects)); 
        });
    });

    describe('a user with the privilege of curator@c5', () => {
        it('should respond with released objects and submissions to the c5 collection', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'curator@c5');
            expect(results.total).toBe(expectedCuratorC5Response.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedCuratorC5Response.objects));  
        });
    });

    describe('a user with the privilege of editor', () => {
        it('should respond with released objects and submissions to all collections', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'editor');
            expect(results.total).toBe(expectedEditorAdminResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedEditorAdminResponse.objects));    
        });
    });

    describe('a user with the privilege of admin', () => {
        it('should respond with released objects and submissions to all collections', async () => {
            expect.assertions(2);
            const results = await searchLearningObjects('', 'admin');
            expect(results.total).toBe(expectedEditorAdminResponse.total);
            expect(new Set(results.objects)).toEqual(new Set(expectedEditorAdminResponse.objects));    
        });
    });
});
