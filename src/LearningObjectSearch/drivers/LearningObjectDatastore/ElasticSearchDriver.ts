import {
  ElasticSearchQuery,
  FilteredElasticSearchQuery,
  ReleasedLearningObjectSearchQuery,
  LearningObjectSearchQuery,
  LearningObjectSearchResult,
  PostFilterQuery,
} from '../../typings';
import { LearningObjectSearchGateway } from '../../interfaces';

const SEARCHABLE_FIELDS = [
  'name',
  'levels',
  'collection.keyword',
  'description',
  'author.name',
  'author.email',
  'author.organization',
  'outcomes.text',
  'outcomes.bloom',
  'outcomes.outcome',
];
const filters = {
  LENGTH: 'length',
  LEVELS: 'level',
  COLLECTION: 'collection',
};

const DEFAULT_QUERY_SIZE = 200;

export class ElasticSearchDriver implements LearningObjectSearchGateway {
  searchReleasedObjects(
    params: ReleasedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    this.buildSearchQuery(params);
    throw new Error('Method not implemented.');
  }
  searchAllObjects(
    params: LearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    throw new Error('Method not implemented.');
  }
  private buildSearchQuery({
    text,
    length,
    level,
    collection,
  }: ReleasedLearningObjectSearchQuery) {
    let body: ElasticSearchQuery = {
      size: DEFAULT_QUERY_SIZE,
      query: {
        bool: {
          should: [
            {
              multi_match: {
                fields: SEARCHABLE_FIELDS,
                query: text,
                fuzziness: 'AUTO',
                slop: 3,
                analyzer: 'stop',
              },
            },
            {
              match_phrase_prefix: {
                description: {
                  query: text,
                  max_expansions: 50,
                  slop: 50,
                },
              },
            },
          ],
        },
      },
    };
    const QUERY_FILTERS = {
      length: length,
      level: level,
      collection: collection,
    };
    const post_filter = this.appendPostFilterStage(QUERY_FILTERS);
  }

  private appendPostFilterStage(FILTERS: {
    length: String[];
    level: String[];
    collection: String[];
  }) {
    let Query = {
      post_filter: {
        bool: {
          must: [
            {
              terms: {
                filterType: filter,
              },
            },
          ],
        },
      },
    };
    return Query;
  }
}
