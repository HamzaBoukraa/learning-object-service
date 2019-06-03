import { PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import * as request from 'request-promise';

const INDEX_LOCATION = `${process.env.ELASTICSEARCH_DOMAIN}/released-objects`;

/**
 * Sends a PUT request to ElasticSearch to index the Learning Object at a
 * specific ID. Here we use the id already associated with the Learning Object
 * for ease of lookup.
 */
export class ElasticSearchPublishingGateway implements PublishingDataStore {
  async addToReleased(releasableObject: LearningObject): Promise<void> {
    const URI = `${INDEX_LOCATION}/_doc/${releasableObject.id}`;
    await request.put(URI, {
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(this.cleanDocument(releasableObject)),
    });
  }

  cleanDocument(releasableObject: LearningObject) {
    const doc = {
      ...releasableObject.toPlainObject(),
      author: {
        name: releasableObject.author.name,
        username: releasableObject.author.username,
        email: releasableObject.author.email,
        organization: releasableObject.author.organization,
      },
      contributors: releasableObject.contributors.map(c => ({
        name: c.name,
        username: c.username,
        email: c.email,
        organization: c.organization,
      })),
    };
    delete doc.children;
    delete doc.metrics;
    delete doc.materials;
    return doc;
  }
}
