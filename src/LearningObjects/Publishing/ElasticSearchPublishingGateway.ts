import { PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import * as request from 'request-promise';
import { cleanLearningObject } from '../../shared/elasticsearch';
import { Client } from '@elastic/elasticsearch';

/**
 * Sends a PUT request to ElasticSearch to index the Learning Object at a
 * specific ID. Here we use the id already associated with the Learning Object
 * for ease of lookup.
 */
export class ElasticSearchPublishingGateway implements PublishingDataStore {
  client: Client;
  constructor() {
    this.client = new Client({ node: process.env.ELASTICSEARCH_DOMAIN });
  }
  async addToReleased(releasableObject: LearningObject): Promise<void> {
    await this.client.index({
      index: 'learning-objects',
      type: '_doc',
      body: cleanLearningObject(releasableObject),
    });
  }
}
