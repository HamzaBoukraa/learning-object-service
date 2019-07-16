import { LearningObject } from '../shared/entity';
import * as request from 'request-promise';
import { cleanLearningObject } from '../shared/elasticsearch';
import { SubmissionPublisher } from './interactors/SubmissionPublisher';
import { Client } from '@elastic/elasticsearch';
import { reportError } from '../shared/SentryConnector';

const INDEX_NAME = 'learning-objects';
/**
 * In the case where the ELASTICSEARCH_DOMAIN is defined in the environment,
 * the URI will point there. Otherwise, it will default to looking for an
 * Elasticsearch node at its default port on the current host.
 */
const URI = process.env.ELASTICSEARCH_DOMAIN
  ? process.env.ELASTICSEARCH_DOMAIN
  : 'http://localhost:9200';

export class ElasticsearchSubmissionPublisher implements SubmissionPublisher {
  client: Client;
  constructor() {
    this.client = new Client({ node: URI });
  }

  /**
   * @description
   * The refresh strategy defaults to false, this means the document will be availible
   * for search at some point after the request has returned. We use this strategy because
   * the availability of a document for search by reviewers/curators should not halt the
   * progress of the author in the application.
   *
   * In the case that the indexing operation fails, an error will be reported for us to
   * retrospectively update the index so that the submission will appear in search, but the
   * author's job will be completed.
   * the action on their end.
   * @inheritdoc
   */
  async publishSubmission(submission: LearningObject): Promise<void> {
    try {
      await this.client.index({
        index: INDEX_NAME,
        type: '_doc',
        body: cleanLearningObject(submission),
      });
    } catch (e) {
      reportError(e);
    }
  }

  /**
   * @description
   * In the case that the delete operation fails, an error will be reported for us to
   * retrospectively fix, but the author requesting the withdrawl will be able to complete
   * the action on their end.
   * @inheritdoc
   */
  async withdrawSubmission(learningObjectID: string) {
    try {
      const response = await this.client.deleteByQuery({
        index: INDEX_NAME,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: { id: learningObjectID },
                },
                {
                  match: { status: LearningObject.Status.WAITING },
                },
              ],
            },
          },
        },
      });
    } catch (e) {
      reportError(e);
    }
  }
}
