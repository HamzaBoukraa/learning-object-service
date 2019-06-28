import { PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import * as request from 'request-promise';
import { cleanLearningObject } from '../../shared/elasticsearch';
import { Client } from '@elastic/elasticsearch';

/**
 * In the case where the ELASTICSEARCH_DOMAIN is defined in the environment,
 * the URI will point there. Otherwise, it will default to looking for an
 * Elasticsearch node at its default port on the current host.
 */
const URI = process.env.ELASTICSEARCH_DOMAIN
  ? process.env.ELASTICSEARCH_DOMAIN
  : 'http://localhost:9200';

/**
 * Sends a PUT request to ElasticSearch to index the Learning Object at a
 * specific ID. Here we use the id already associated with the Learning Object
 * for ease of lookup.
 */
export class ElasticSearchPublishingGateway implements PublishingDataStore {
  client: Client;
  constructor() {
    this.client = new Client({ node: URI });
  }
  async addToReleased(releasableObject: LearningObject): Promise<void> {
    await this.client.index({
      index: 'learning-objects',
      type: '_doc',
      body: cleanLearningObject(releasableObject),
    });
  }
}
