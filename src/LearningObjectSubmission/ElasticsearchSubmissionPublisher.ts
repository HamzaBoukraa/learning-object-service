import { LearningObject } from '../shared/entity';
import * as request from 'request-promise';
import { cleanLearningObject } from '../shared/elasticsearch';
import { SubmissionPublisher } from './interactors/SubmissionPublisher';
import { Client } from '@elastic/elasticsearch';

const INDEX_NAME = 'released-objects';
const INDEX_LOCATION = `${process.env.ELASTICSEARCH_DOMAIN}/${INDEX_NAME}`;


/**
 * Splits the domain on the delimiter following the network protocol and takes the
 * rightwards half, which is the host without the protocol.
 */
const HOST = process.env.ELASTICSEARCH_DOMAIN
  ? process.env.ELASTICSEARCH_DOMAIN.split('://')[1]
  : undefined;

export class ElasticsearchSubmissionPublisher implements SubmissionPublisher {
  client: Client;
  constructor() {
    this.client = new Client({ node: process.env.ELASTICSEARCH_DOMAIN });
  }

  async publishSubmission(submission: LearningObject): Promise<void> {
    const URI = `${INDEX_LOCATION}/_doc/${submission.id}`;
    await request.put(URI, {
      headers: {
        'Content-Type': 'application/json',
        'Host': HOST,
      },
      body: JSON.stringify(cleanLearningObject(submission)),
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
