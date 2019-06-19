import { mapping } from '../elasticsearch-data/elasticsearch_learning-object_mapping';
import { seedData } from '../elasticsearch-data/elasticsearch_seed';
const request = require('request-promise');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node:  process.env.ELASTIC_SEARCH_TEST_NODE_URI ? process.env.ELASTIC_SEARCH_TEST_NODE_URI : 'http://localhost:9200' });

/**
 * This function is called before all tests run
 * in learning-object-service-gateway.spec.js
 */
export async function initElasticsearchNode() {
    try {
        await createLearningObjectIndex();
        await insertElasticsearchTestData();
    } catch(err) {
        console.error(err);
        throw err;
    }
}

/**
 * Creates the learning-objects Index and passes
 * in an object that contains settings and mapping options
 */
async function createLearningObjectIndex() {
    return await client.indices.create({
        index: 'learning-objects',
        body: mapping
    });
}

/**
 * Feeds an array into the Elasticsearch Bulk API
 * Promise will not resolve until all items in the
 * Index are available to be searched. 
 */
async function insertElasticsearchTestData() {
    return await client.bulk({
        body: seedData,
        refresh: 'wait_for',
    });
}

