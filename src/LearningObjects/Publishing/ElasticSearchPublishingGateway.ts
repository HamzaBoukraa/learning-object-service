import { PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import * as request from 'request-promise';
import { cleanLearningObject } from '../../shared/elasticsearch';
import { Client } from '@elastic/elasticsearch';
import { formatUpdateQueryParam } from '../../shared/elasticsearch/HelperFunctions';

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

  /**
   *
   * @param releasableObject {LearningObject}
   *
   * addToReleased attempts to update the existing Released Learning
   * Object document in Elasticsearch. If the Release Learning Object
   * document does not exist, the function will insert the provided Learning
   * Object.
   */
  async addToReleased(releasableObject: LearningObject): Promise<void> {
    const cleanObject = cleanLearningObject(releasableObject);
    const formattedUpdateParam = formatUpdateQueryParam(cleanObject);
    const updateResponse = await this.client.updateByQuery({
      index: 'learning-objects',
      type: '_doc',
      body: {
        query: {
          bool: {
            must: [
              {
                term: {
                  id: releasableObject.id,
                },
              },
              {
                term: {
                  status: LearningObject.Status.RELEASED,
                },
              },
            ],
          },
        },
        script: {
          source: formattedUpdateParam,
        },
      },
    });
    if (updateResponse.body.updated === 0) {
      await this.client.index({
        index: 'learning-objects',
        type: '_doc',
        body: cleanObject,
      });
    }
  }
}
