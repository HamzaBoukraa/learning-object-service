import { mapping } from './elasticsearch-data/elasticsearch_learning-object_mapping';
import { seedData } from './elasticsearch-data/elasticsearch_seed';
const request = require('request-promise');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node:  process.env.ELASTIC_SEARCH_TEST_NODE_URI ? process.env.ELASTIC_SEARCH_TEST_NODE_URI : 'http://localhost:9200' });

export async function initElasticsearchNode() {
    try {
        await createLearningObjectIndex();
        await insertElasticsearchTestData();
        // await waitForStatusGreen();
    } catch(err) {
        console.error(err);
        throw err;
    }
}

async function createLearningObjectIndex() {
    return await client.indices.create({
        index: 'learning-objects',
        body: mapping
    });
}

async function insertElasticsearchTestData() {
    return await client.bulk({
        body: seedData,
        refresh: 'wait_for',
    });
}

// async function waitForStatusGreen() {
//     try {
//         const response = await request({
//             method: 'GET',
//             uri: process.env.ELASTIC_SEARCH_TEST_NODE_URI + `/_cluster/health?wait_for_status=yellow&timeout=50s`,
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//         });
//          return response;
//     } catch (err) {
//         console.log(err);
//         throw err;
//     }
// }

export async function destroyElasticsearchIndex() {
    return await client.indices.delete({
        index: 'learning-objects',
    });
}

