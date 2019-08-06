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
    let cleanObject = cleanLearningObject(releasableObject);
    let releaseField = Object.keys(cleanObject);
    let releaseSource: string = '';
    releaseField.map(field => {
      let updateValue = cleanObject[field];
      if (
        Array.isArray(field)
        && field[0]
        && typeof field[0] === 'object'
      ) {
        field.forEach(subObj => {
          let subField = Object.keys(subObj);
          subField.forEach(sub => {
            let updateSubValue = cleanObject[sub];
            releaseSource = releaseSource.concat(`ctx._source.${field}.${sub} = \"${updateSubValue}\";`);
          });
        });
      } else if (typeof field === 'object') {
        let subField = Object.keys(field);
        subField.forEach(sub => {
          let updateSubValue = cleanObject[sub];
          releaseSource = releaseSource.concat(`ctx._source.${field}.${sub} = \"${updateSubValue}\";`);
        });
      } else {
        releaseSource = releaseSource.concat(`ctx._source.${field} = \"${updateValue}\";`);
      }
    });
    const updateResponse = await this.client.updateByQuery({
      index: 'learning-objects',
      type: '_doc',
      body: {
        query: {
          bool: {
            must: [
              {
                term: {
                  'id.keyword': releasableObject.id,
                },
              },
              {
                term: {
                  'status.keyword': LearningObject.Status.RELEASED,
                },
              },
            ],
          },
        },
        script: {
          source: releaseSource,
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
