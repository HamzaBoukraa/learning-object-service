import { LearningObject } from '../shared/entity';
import * as request from 'request-promise';
import { cleanLearningObject } from '../shared/elasticsearch';
import { SubmissionPublisher } from './interactors/SubmissionPublisher';
import { Client } from '@elastic/elasticsearch';

const INDEX_NAME = 'released-objects';

export class ElasticsearchSubmissionPublisher implements SubmissionPublisher {
  client: Client;
  constructor() {
    this.client = new Client({ node: process.env.ELASTICSEARCH_DOMAIN });
  }

  /**
   * @description
   * The refresh strategy defaults to false, this means the document will be availible
   * for search at some point after the request has returned. We use this strategy because
   * the availability of a document for search by reviewers/curators should not halt the
   * progress of the author in the application.
   * @inheritdoc
   */
  async publishSubmission(submission: LearningObject): Promise<void> {
    await this.client.index({
      index: INDEX_NAME,
      type: '_doc',
      body: cleanLearningObject(submission),
    });
  }

  async withdrawlSubmission(learningObjectID: string) {
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
  }
}
