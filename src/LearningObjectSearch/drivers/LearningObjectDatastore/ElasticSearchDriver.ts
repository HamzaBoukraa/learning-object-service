import {
  ElasticSearchQuery,
  FilteredElasticSearchQuery,
  ReleasedLearningObjectSearchQuery,
  LearningObjectSearchQuery,
  LearningObjectSearchResult,
  PostFilterQuery,
} from '../../typings';
import * as request from 'request-promise';
import { LearningObjectDatastore } from '../../interfaces';
import { sanitizeObject } from '../../../shared/functions';

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
const MOCK_URI = 'http://localhost:9200/released_objects/_search';
const DEFAULT_QUERY_SIZE = 10;

export class ElasticSearchDriver implements LearningObjectDatastore {
  searchReleasedObjects(
    params: ReleasedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    const elasticQuery: Partial<ElasticSearchQuery> = this.buildSearchQuery(params);
    if (params.sortType && params.orderBy) {
      this.appendSortingandPagination(elasticQuery);
    }
    return new Promise<LearningObjectSearchResult>((resolve, reject) => {
      request({
        uri: MOCK_URI,
        json: true,
        body: elasticQuery,
      }).then(res => {
        resolve(res);
      }).catch(err => {
        reject(err);
      });
    });

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
    limit
  }: ReleasedLearningObjectSearchQuery) {

    const queryFilters = sanitizeObject({
      object: {
        length,
        level,
        collection,
      }
    });

    let body: ElasticSearchQuery = {
      size: limit ? limit : DEFAULT_QUERY_SIZE,
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
    if (Object.keys(queryFilters).length !== 0) {
      const post_filter = queryFilters ? this.appendPostFilterStage(queryFilters) : null;
      return { ...body, post_filter };
    }

    return { ...body };
  }

  private appendPostFilterStage(filters: {
    length?: String[];
    level?: String[];
    collection?: String[];
  }) {
    let Query = {
      bool: {
        // @ts-ignore Empty array assignment is valid
        must: [],
      },
    };
    let termBody: { [x: string]: string[]; };
    Object.keys(filters).forEach(objectKey => {
      if (filters[objectKey]) {
        termBody = {};
        termBody[`${objectKey}`] = filters[objectKey];
        Query.bool.must.push({ terms: termBody });
      }
    });
    console.log(Query);
    return Query;
  }

  private appendSortingandPagination(query: Partial<ElasticSearchQuery>) {

}
}
