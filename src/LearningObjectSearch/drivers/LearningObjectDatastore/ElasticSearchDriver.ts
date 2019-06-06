import {
  ElasticSearchQuery,
  FilteredElasticSearchQuery,
  LearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
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

const MOCK_URI = 'http://localhost:9200/released_objects/_search';
const DEFAULT_QUERY_SIZE = 10;

export class ElasticSearchDriver implements LearningObjectDatastore {
  searchReleasedObjects(
    params: LearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    const elasticQuery: Partial<ElasticSearchQuery> = this.buildSearchQuery(
      params,
    );

    if (params.sortType && params.orderBy) {
      const { sortType, orderBy } = params;
      this.appendSorting({
        query: elasticQuery,
        sortType,
        orderBy,
      });
    }
    return new Promise<LearningObjectSearchResult>((resolve, reject) => {
      request({
        uri: MOCK_URI,
        json: true,
        body: elasticQuery,
      })
        .then(res => {
          resolve(this.toPaginatedLearningObjects(res));
        })
        .catch(err => {
          reject(err);
        });
    });
  }
  searchAllObjects(
    params: PrivilegedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    throw new Error('Method not implemented.');
  }
  private buildSearchQuery({
    text,
    length,
    level,
    collection,
    limit,
  }: LearningObjectSearchQuery) {
    const queryFilters = sanitizeObject({
      object: {
        length,
        level,
        collection,
      },
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
      const post_filter = queryFilters
        ? this.appendPostFilterStage(queryFilters)
        : null;
      return { ...body, post_filter };
    }

    return { ...body };
  }

  private appendPostFilterStage(filters: {
    length?: String[];
    level?: String[];
    collection?: String[];
  }) {
    let query = {
      bool: {
        // @ts-ignore Empty array assignment is valid
        must: [],
      },
    };
    let termBody: { [x: string]: string[] };
    Object.keys(filters).forEach(objectKey => {
      if (filters[objectKey]) {
        termBody = {};
        termBody[`${objectKey}`] = filters[objectKey];
        query.bool.must.push({ terms: termBody });
      }
    });
    console.log(query);
    return query;
  }

  private appendSorting(params: {
    query: Partial<ElasticSearchQuery>;
    sortType: number;
    orderBy: string;
  }) {
    const { query, sortType, orderBy } = params;
    const sorter = {};
    sorter[`${orderBy}.keyword`] = { order: sortType === -1 ? 'decs' : 'asc' };
    query.sort = [sorter];
    return query;
  }

  private toPaginatedLearningObjects(results: any): LearningObjectSearchResult {
    const total = results.hits.total;
    let objects = results.hits.hits;
    return { total, objects };
  }
}
