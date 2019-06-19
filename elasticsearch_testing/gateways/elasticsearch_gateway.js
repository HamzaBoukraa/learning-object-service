import { mapping } from '../elasticsearch-data/elasticsearch_learning-object_mapping';
import { seedData } from '../elasticsearch-data/elasticsearch_seed';
const request = require('request-promise');
const { Client } = require('@elastic/elasticsearch')
const client = new Client({ node:  process.env.ELASTIC_SEARCH_TEST_NODE_URI ? process.env.ELASTIC_SEARCH_TEST_NODE_URI : 'http://localhost:9200' });

export async function initElasticsearchNode() {
    try {
        await createLearningObjectIndex();
        await insertElasticsearchTestData();
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

export async function destroyElasticsearchIndex() {
    return await client.indices.delete({
        index: 'learning-objects',
    });
}

