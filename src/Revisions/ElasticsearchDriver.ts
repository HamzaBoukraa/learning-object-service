import { Client } from '@elastic/elasticsearch';
import { LearningObject } from '../shared/entity';
import { reportError } from '../shared/SentryConnector';
import { cleanLearningObjectSearchDocument } from '../shared/elasticsearch/CleanLearningObject/CleanLearningObject';
import { RevisionsSearchIndex } from './RevisionsSearchIndex';
import { getFileTypesOnObjects } from '../shared/MongoDB/HelperFunctions';

const INDEX_NAME = 'learning-objects';
/**
 * In the case where the ELASTICSEARCH_DOMAIN is defined in the environment,
 * the URI will point there. Otherwise, it will default to looking for an
 * Elasticsearch node at its default port on the current host.
 */
const URI = process.env.ELASTICSEARCH_DOMAIN
  ? process.env.ELASTICSEARCH_DOMAIN
  : 'http://localhost:9200';

export class ElasticsearchDriver implements RevisionsSearchIndex {
  client: Client;
  constructor() {
    this.client = new Client({ node: URI });
  }

async insertLearningObject(learningObject: LearningObject): Promise<void> {
  const fileTypes = await getFileTypesOnObjects(learningObject);
  try {
      await this.client.index({
        index: INDEX_NAME,
        type: '_doc',
        body: cleanLearningObjectSearchDocument(learningObject, fileTypes),
      });
    } catch (e) {
      reportError(e);
    }
  }
}
