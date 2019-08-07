import { LearningObject } from '../shared/entity';
import * as request from 'request-promise';
import { cleanLearningObject } from '../shared/elasticsearch';
import { SubmissionPublisher } from './interactors/SubmissionPublisher';
import { Client } from '@elastic/elasticsearch';
import { reportError } from '../shared/SentryConnector';
import { LearningObjectMetadataUpdates } from '../shared/types';

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
   * In the case that an update does fail, an error will be reported for us to fix retrospectively.
   * Until that is done, the searchable submissions will be out of date with the Learning Object data
   * in storage.
   * @inheritdoc
   */
  async updateSubmission(params: {
    learningObjectId: string;
    updates: LearningObjectMetadataUpdates;
  }) {
    const { learningObjectId, updates } = params;
    let updateField = Object.keys(updates);
    let updateSource: string;
    updateField.map(field => {
      if (Array.isArray(updates[field])) {
        updates[field].map((arrayVal: string, index: number) => {
          updateSource = updateSource.concat(`ctx.source.${field}[${index}] = \"${arrayVal}\";`);
        });
      }
      let updateValue = updates[field];
      updateSource = updateSource.concat(`ctx._source.${field} = \"${updateValue}\";`);
    });
    let learningObjectUpdateRequest = {
      query: {
        term: {
          id: {
            value: learningObjectId,
          },
        },
      },
      script: {
        source : updateSource,
      },
    };
    try {
    await this.client.updateByQuery({
        index: INDEX_NAME,
        type: '_doc',
        body: learningObjectUpdateRequest,
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
  async deleteSubmission(learningObjectID: string) {
    try {
      await this.client.deleteByQuery({
        index: INDEX_NAME,
        body: {
          query: {
            bool: {
              must: [
                {
                  match: { id: learningObjectID },
                },
                {
                  bool: {
                    should: [
                      { term: { status: LearningObject.Status.WAITING } },
                      { term: { status: LearningObject.Status.PROOFING } },
                      { term: { status: LearningObject.Status.REVIEW } },
                    ],
                  },
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
