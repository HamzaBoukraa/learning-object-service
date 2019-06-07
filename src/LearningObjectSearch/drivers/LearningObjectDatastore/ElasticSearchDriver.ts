import {
  ElasticSearchQuery,
  LearningObjectSearchQuery,
  PrivilegedLearningObjectSearchQuery,
  LearningObjectSearchResult,
  SortOrder,
  CollectionAccessMap,
  BoolOperation,
  SortOperation,
  TermsQuery,
} from '../../typings';
import { LearningObject } from '../../../shared/entity';
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
  /**
   * Performs a search on learning objects in the elastic search index and only returns released objects.
   *
   * @param {LearningObjectSearchQuery} params Object containing search text and field queries
   * @returns {Promise<{ total: number, object: LearningObject[] }>}
   */
  searchReleasedObjects(
    params: LearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    const elasticQuery: ElasticSearchQuery = this.buildReleasedSearchQuery(params);
    return this.executeQuery(elasticQuery);
  }

  /**
   * Calls a build function that returns an elastic search query before appending a
   * released status filter to the body
   *
   * @param {LearningObjectSearchResult} params Object containing search text and field queries
   * @returns {Promise<{ElasticSearchQuery}>} The elastic search query object needed to perform a search
   */
  private buildReleasedSearchQuery(params: LearningObjectSearchQuery): ElasticSearchQuery {
    const query = this.buildSearchQuery(params);
    this.appendReleasedStatusFilter(query);
    return query;
  }

  /**
   * performs search on all learning objects in the index based on access privelages
   *
   * @param {PrivilegedLearningObjectSearchQuery} params Object containing search text and field queries with {collectionRestrictions} for privileged users.
   * @returns {Promise<{LearningObjectSearchResult}>}
   */
  searchAllObjects(
    params: PrivilegedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    const elasticQuery: ElasticSearchQuery = this.buildPrivilegedSearchQuery(params);
    console.log('TCL: ElasticSearchDriver -> elasticQuery', JSON.stringify(elasticQuery));
    return this.executeQuery(elasticQuery);
  }

  private appendReleasedStatusFilter(elasticQuery: ElasticSearchQuery): void {
    const releasedFilter = { term: { status: { value: LearningObject.Status.RELEASED } } };
    elasticQuery.post_filter = elasticQuery.post_filter || {
      bool: {
        // @ts-ignore Empty array assignment is valid
        must: [],
      },
    } as BoolOperation;
    (elasticQuery.post_filter as BoolOperation).bool.must.push(releasedFilter);
  }
  private buildSearchQuery(params: LearningObjectSearchQuery) {
    const {
      text,
      limit,
      sortType,
      orderBy,
    } = params;

    let body: ElasticSearchQuery;
    if (text && text.length) {
      body = {
        size: limit || DEFAULT_QUERY_SIZE,
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
    }
    const queryFilters = this.getQueryFilters(params)
    if (Object.keys(queryFilters).length) {
      this.appendQueryFilters({ query: body, filters: queryFilters });
    }
    if (orderBy) {
      this.appendSortStage({
        query: body,
        sortType,
        orderBy,
      });
    }
    return body;
  }


  private buildPrivilegedSearchQuery(params: PrivilegedLearningObjectSearchQuery): ElasticSearchQuery {
    const query = this.buildSearchQuery(params);
    const { collectionRestrictions } = params;
    const queryFilters = this.getQueryFilters(params)
    if (collectionRestrictions) {
      this.appendCollectionRestrictionsFilter({ query, filters: queryFilters, restrictions: collectionRestrictions });
    }
    return query;
  }

  private appendQueryFilters({ query, filters }: {
    query: ElasticSearchQuery;
    filters: Partial<LearningObjectSearchQuery>
  }): void {
    query.post_filter = query.post_filter || {
      bool: {
        should: [{ bool: { must: this.convertQueryFiltersToTerms(filters) } }],
      },
    } as BoolOperation;
  }

  private appendSortStage({ query, sortType, orderBy }: {
    query: ElasticSearchQuery;
    sortType: SortOrder;
    orderBy: string;
  }): void {
    const sorter: SortOperation = {};
    sorter[`${orderBy}.keyword`] = { order: sortType === -1 ? 'desc' : 'asc' };
    query.sort = sorter;
  }

  private toPaginatedLearningObjects(results: any): LearningObjectSearchResult {
    const total = results.hits.total.value;
    let objects = results.hits.hits;
    let learningObjects: LearningObject[] = [];
    objects.forEach((set: any) => {
      learningObjects.push(set._source);
    });
    return { total, objects: learningObjects };
  }
  private appendCollectionRestrictionsFilter(
    { query, filters, restrictions }: { query: ElasticSearchQuery, filters: Partial<LearningObjectSearchQuery>, restrictions: CollectionAccessMap },
  ): void {
    query.post_filter = query.post_filter || {
      bool: {
        should: [{ bool: { must: this.convertQueryFiltersToTerms(filters) } }],
      },
    };

    const nonStatusFilters: Partial<LearningObjectSearchQuery> = filters;
    delete nonStatusFilters.collection;
    delete nonStatusFilters.status;

    const queryLimitations = {
      bool: {
        // @ts-ignore Empty array assignment is valid
        must: [{ bool: { should: [] } }, {
          bool: {
            must: this.convertQueryFiltersToTerms(nonStatusFilters)
          },
        },
        ],
      },
    };


    Object.keys(restrictions).forEach(collectionName => {
      const restriction = {
        bool: {
          must: [{
            term: {
              collection: { value: collectionName },
            },
          },
          {
            terms: {
              status: restrictions[collectionName],
            },
          }],
        },
      };
      queryLimitations.bool.must[0].bool.should.push(restriction);
    });

    (query.post_filter as BoolOperation).bool.should.push(
      queryLimitations,
    )

  }


  private getQueryFilters(params: LearningObjectSearchQuery): Partial<LearningObjectSearchQuery> {
    const { length, level, collection, status } = params;
    const queryFilters = sanitizeObject({
      object: {
        length,
        level,
        collection,
        status,
      },
    });
    return queryFilters;
  }

  private convertQueryFiltersToTerms(filters: Partial<LearningObjectSearchQuery>): TermsQuery[] {
    const termsQueries: TermsQuery[] = []
    Object.keys(filters).forEach(objectKey => {
      const termBody: { [property: string]: string[] } = {};
      termBody[`${objectKey}`] = filters[objectKey];
      termsQueries.push({ terms: termBody });
    });
    return termsQueries;
  }

  private executeQuery(query: ElasticSearchQuery): Promise<LearningObjectSearchResult> {
    return new Promise<LearningObjectSearchResult>((resolve, reject) => {
      request({
        uri: MOCK_URI,
        json: true,
        body: query,
      })
        .then(res => {
          resolve(this.toPaginatedLearningObjects(res));
        })
        .catch(err => {
          reject(err);
        });
    });
  };
}
