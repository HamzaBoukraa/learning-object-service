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
  LearningObjectSummary,
  AuthorSummary,
  LearningObject,
  User,
} from '../../typings';
import { SearchResponse } from 'elasticsearch';
import * as request from 'request-promise';
import { LearningObjectDatastore } from '../../interfaces';
import { sanitizeObject } from '../../../shared/functions';
import { RequestError, StatusCodeError } from 'request-promise/errors';
import {
  ResourceError,
  ResourceErrorReason,
  ServiceError,
  ServiceErrorReason,
} from '../../../shared/errors';

const ELASTICSEARCH_DOMAIN = process.env.ELASTICSEARCH_DOMAIN;
const LEARNING_OBJECT_INDEX = 'learning-objects';

const INDEX_URI = (index: string) => `${ELASTICSEARCH_DOMAIN}/${index}/_search`;

const SEARCHABLE_FIELDS = [
  'name',
  'collection.keyword',
  'description',
  'author.name',
  'author.email',
  'author.organization',
  'outcomes.text',
];

const QUERY_DEFAULTS = {
  SIZE: 10,
  FUZZINESS: 'AUTO',
  MULTI_MATCH_SLOP: 3,
  ANALYZER: 'stop',
  MATCH_PHRASE_PREFIX_SLOP: 50,
  MATCH_PHRASE_PREFIX_EXPANSIONS: 50,
  MATCH_OUTCOME_PHRASE_SLOP: 5,
  MATCH_OUTCOME_EXPANSIONS: 5,
};

const AGGREGATION_DEFAULTS = {
  // High threshold is set so that all buckets are considered in later stages of the aggregation
  TERMS_MAX_SIZE: 100000,
};

export class ElasticSearchLearningObjectDatastore
  implements LearningObjectDatastore {
  /**
   * Performs a search on learning objects in the elastic search index and only returns released objects.
   *
   * @param {LearningObjectSearchQuery} params Object containing search text and field queries
   * @returns {Promise<{ total: number, object: LearningObject[] }>}
   */
  async searchReleasedObjects(
    params: LearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    const elasticQuery: ElasticSearchQuery = this.buildReleasedSearchQuery(
      params,
    );
    const results = await this.executeQuery(elasticQuery);
    return this.convertHitsToLearningObjectSearchResult(results);
  }

  /**
   * performs search on all learning objects in the index based on access privileges
   *
   * @param {PrivilegedLearningObjectSearchQuery} params Object containing search text and field queries with {collectionRestrictions} for privileged users.
   * @returns {Promise<{LearningObjectSearchResult}>}
   */
  async searchAllObjects(
    params: PrivilegedLearningObjectSearchQuery,
  ): Promise<LearningObjectSearchResult> {
    const elasticQuery: ElasticSearchQuery = this.buildPrivilegedSearchQuery(
      params,
    );
    const results = await this.executeQuery(elasticQuery);
    return this.convertAggregationToLearningObjectSearchResult(results);
  }

  /**
   * Builds ElasticSearchQuery for searching all released Learning Objects by applying LearningObjectSearchQuery params and restricting set to just released Learning Objects
   *
   * @param {LearningObjectSearchResult} params Object containing search text and field queries
   * @returns {Promise<{ElasticSearchQuery}>} The elastic search query object needed to perform a search
   */
  private buildReleasedSearchQuery(
    params: LearningObjectSearchQuery,
  ): ElasticSearchQuery {
    const query = this.buildSearchQuery(params);
    this.appendReleasedStatusFilter(query);
    return query;
  }

  /**
   * Builds ElasticSearchQuery for searching all Learning Objects by applying LearningObjectSearchQuery params and restricting set based on provided collection restrictions
   *
   * *** NOTE ***
   * Limit is reset to 0 because hits do not need to be returned
   *
   * @private
   * @param {PrivilegedLearningObjectSearchQuery} params [Object containing search text, field queries, and collection restrictions]
   * @returns {ElasticSearchQuery}
   * @memberof ElasticSearchDriver
   */
  private buildPrivilegedSearchQuery(
    params: PrivilegedLearningObjectSearchQuery,
  ): ElasticSearchQuery {
    const query = this.buildSearchQuery({
      ...(params as LearningObjectSearchQuery),
      limit: 0,
    });
    const { collectionRestrictions } = params;
    const queryFilters = this.getQueryFilters(
      params as LearningObjectSearchQuery,
    );
    if (collectionRestrictions && Object.keys(collectionRestrictions).length) {
      this.appendCollectionRestrictionsFilter({
        query,
        filters: queryFilters,
        restrictions: collectionRestrictions,
      });
    }
    this.appendDuplicateFilterAggregation({ query, filters: params });
    return query;
  }

  /**
   * Builds ElasticSearchQuery by applying LearningObjectSearchQuery params
   *
   * @private
   * @param {LearningObjectSearchQuery} params
   * @returns {ElasticSearchQuery}
   * @memberof ElasticSearchDriver
   */
  private buildSearchQuery(
    params: LearningObjectSearchQuery,
  ): ElasticSearchQuery {
    const { text, limit, page, sortType, orderBy } = params;

    const elasticQuery: Partial<ElasticSearchQuery> = {};
    if (text) {
      elasticQuery.query = {
        bool: {
          should: [
            {
              multi_match: {
                fields: SEARCHABLE_FIELDS,
                query: text,
                fuzziness: QUERY_DEFAULTS.FUZZINESS,
                slop: QUERY_DEFAULTS.MULTI_MATCH_SLOP,
                analyzer: QUERY_DEFAULTS.ANALYZER,
              },
            },
            {
              match_phrase_prefix: {
                description: {
                  query: text,
                  max_expansions: QUERY_DEFAULTS.MATCH_PHRASE_PREFIX_EXPANSIONS,
                  slop: QUERY_DEFAULTS.MATCH_PHRASE_PREFIX_SLOP,
                },
              },
            },
            {
              match_phrase_prefix: {
                'outcomes.text': {
                  query: text,
                  max_expansions: QUERY_DEFAULTS.MATCH_OUTCOME_EXPANSIONS,
                  slop: QUERY_DEFAULTS.MATCH_OUTCOME_PHRASE_SLOP,
                },
              },
            },
          ],
        },
      };
    }
    const queryFilters = this.getQueryFilters(params);
    if (Object.keys(queryFilters).length) {
      this.appendQueryFilters({
        query: elasticQuery as ElasticSearchQuery,
        filters: queryFilters,
      });
    }
    if (orderBy) {
      this.appendSortStage({
        query: elasticQuery as ElasticSearchQuery,
        sortType,
        orderBy,
      });
    }
    this.appendPaginator({
      query: elasticQuery as ElasticSearchQuery,
      limit,
      page,
    });
    return elasticQuery as ElasticSearchQuery;
  }

  /**
   * Returns all defined query filters
   * Some filters are re-mapped to adhere to the documents structure within the index
   *
   * @private
   * @param {LearningObjectSearchQuery} params [Object containing search text, and field queries]
   * @returns {Partial<LearningObjectSearchQuery>}
   * @memberof ElasticSearchDriver
   */
  private getQueryFilters(
    params: LearningObjectSearchQuery,
  ): Partial<LearningObjectSearchQuery> {
    const {
      length,
      level,
      collection,
      status,
      standardOutcomeIDs,
      guidelines,
    } = params;
    const queryFilters = sanitizeObject({
      object: {
        length,
        level,
        collection,
        status,
        'outcomes.mappings.id': standardOutcomeIDs,
        'outcomes.mappings.source': guidelines,
      },
    });
    return queryFilters || {};
  }

  /**
   * Appends post filter for released status to restrict set to only released Learning Objects
   *
   * @private
   * @param {ElasticSearchQuery} elasticQuery [The query object to append post filter to]
   * @memberof ElasticSearchDriver
   */
  private appendReleasedStatusFilter(elasticQuery: ElasticSearchQuery): void {
    const releasedFilter = {
      term: { status: { value: LearningObject.Status.RELEASED } },
    };
    elasticQuery.post_filter =
      elasticQuery.post_filter ||
      ({
        bool: {
          should: [{ bool: { must: [] } }],
        },
      } as BoolOperation);
    // @ts-ignore  (elasticQuery.post_filter as BoolOperation).bool.should[0] is of type BoolOperation and cannot be properly casted
    (elasticQuery.post_filter as BoolOperation).bool.should[0].bool.must.push(
      releasedFilter,
    );
  }

  /**
   * Appends query filters to ElasticSearchQuery
   *
   * @private
   * @param {ElasticSearchQuery} query [The query object to append post filters to]
   * @param {Partial<LearningObjectSearchQuery>} filters [Object containing filters to be applied to set]
   * @memberof ElasticSearchDriver
   */
  private appendQueryFilters({
    query,
    filters,
  }: {
    query: ElasticSearchQuery;
    filters: Partial<LearningObjectSearchQuery>;
  }): void {
    query.post_filter =
      query.post_filter ||
      ({
        bool: {
          should: [
            { bool: { must: this.convertQueryFiltersToTerms(filters) } },
          ],
        },
      } as BoolOperation);
  }

  /**
   * Appends sort stage to ElasticSearchQuery
   *
   * @private
   * @param {ElasticSearchQuery} query [The query object to append sort stage to]
   * @param {SortOrder} sortType [Value indicating the direction of the sort]
   * @param {string} orderBy [The property to order results by]
   * @memberof ElasticSearchDriver
   */
  private appendSortStage({
    query,
    sortType,
    orderBy,
  }: {
    query: ElasticSearchQuery;
    sortType: SortOrder;
    orderBy: string;
  }): void {
    const sorter: SortOperation = this.getSorter({ orderBy, sortType });
    query.sort = sorter;
  }

  /**
   * Returns a SortOperation object that applies `orderBy` and sorts either `asc` or `desc` depending on the value fo `sortType`
   *
   * @private
   * @param {string} orderBy [The property to order by]
   * @param {number} sortType [The direction of the sort]
   * @returns
   * @memberof ElasticSearchLearningObjectDatastore
   */
  private getSorter({
    orderBy,
    sortType,
  }: {
    orderBy: string;
    sortType: number;
  }) {
    const sorter: SortOperation = {};
    sorter[`${orderBy}.keyword`] = { order: sortType === -1 ? 'desc' : 'asc' };
    return sorter;
  }

  /**
   * Appends pagination object which includes the size (Maximum amount of results to return or limit) and from (What section of results to return or page) properties
   * *** If no limit is defined, the default limit is used. ***
   * *** from (page) + size (limit) can not be more than the index.max_result_window index setting which defaults to 10,000. ***
   * *** https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-from-size.html ***
   *
   * @private
   * @param {ElasticSearchQuery} query [The query object to append pagination to]
   * @param {number} limit [The maximum amount results to return]
   * @param {number} page [The page of results to return]
   * @returns {ElasticSearchPaginator}
   * @memberof ElasticSearchGateway
   */
  private appendPaginator({
    query,
    limit = QUERY_DEFAULTS.SIZE,
    page,
  }: {
    query: ElasticSearchQuery;
    limit: number;
    page: number;
  }): void {
    query.size = limit;
    query.from = this.formatFromValue(page);
  }

  /**
   * Ensures the `from` value is valid by setting a default of `0` if the passed value is undefined or less than `0`
   *
   * @private
   * @param {number} value [From value to be formatted]
   * @returns {number}
   * @memberof ElasticSearchLearningObjectDatastore
   */
  private formatFromValue(value: number): number {
    let formattedPage = 0;
    if (value != null) {
      formattedPage = value < 0 ? 0 : value;
    }
    return formattedPage;
  }

  /**
   * Appends filters to restrict access to unreleased Learning Objects based on specified collection access
   *
   * @private
   * @param {ElasticSearchQuery} query [The query object to apply collection restrictions to]
   * @param {Partial<LearningObjectSearchQuery>} filters [Object containing filters to be applied to set]
   * @param {CollectionAccessMap} restrictions [Object mapping collections to accessible statuses]
   * @memberof ElasticSearchDriver
   */
  private appendCollectionRestrictionsFilter({
    query,
    filters,
    restrictions,
  }: {
    query: ElasticSearchQuery;
    filters: Partial<LearningObjectSearchQuery>;
    restrictions: CollectionAccessMap;
  }): void {
    query.post_filter = query.post_filter || {
      bool: {
        should: [{ bool: { must: this.convertQueryFiltersToTerms(filters) } }],
      },
    };

    const propertyFilters: Partial<LearningObjectSearchQuery> = filters;
    delete propertyFilters.collection;
    delete propertyFilters.status;

    const restrictionsFilter = {
      bool: {
        must: [
          // @ts-ignore Empty array assignment is valid
          { bool: { should: [] } },
          {
            bool: {
              must: this.convertQueryFiltersToTerms(propertyFilters),
            },
          },
        ],
      },
    };

    Object.keys(restrictions).forEach(collectionName => {
      const restriction = {
        bool: {
          must: [
            {
              term: {
                collection: { value: collectionName },
              },
            },
            {
              terms: {
                status: restrictions[collectionName],
              },
            },
          ],
        },
      };
      restrictionsFilter.bool.must[0].bool.should.push(restriction);
    });

    (query.post_filter as BoolOperation).bool.should.push(restrictionsFilter);
  }

  /**
   * Appends aggregation stage to filter out duplicate objects and only return furthest along Learning Object by:
   *
   * Grouping results by `id` to place Learning Object copies within the same bucket
   * Sorting the items within the bucket by `revision` in ascending order
   * Returning only the first item in the sorted bucket
   *
   * *** NOTE ***
   * If no sort if specified the default sort will be by score/relevancy
   *
   * `terms.size` is set to a high threshold to allow allow bucket results to be filtered in sub-aggregations
   * Performance issues noted here https://github.com/elastic/elasticsearch/issues/4915 and here https://github.com/elastic/elasticsearch/issues/21487,
   * should not be an issue because each bucket filtered by terms will have a cardinality <= 2 which is the number of released objects and unreleased objects
   * with the same `id`. Or in other words, only two copies of the same object can exist at any point in time in the index, one released and one submitted for review.
   *
   * @private
   * @param {ElasticSearchQuery} query [The query object to append the aggregation to]
   * @param {Partial<LearningObjectSearchQuery>} filters [Filters that will be applied to the aggregation]
   * @memberof ElasticSearchLearningObjectDatastore
   */
  private appendDuplicateFilterAggregation({
    query,
    filters,
  }: {
    query: ElasticSearchQuery;
    filters: Partial<LearningObjectSearchQuery>;
  }): void {
    const { limit, page, sortType, orderBy } = filters;
    let sorter: SortOperation = { score: { order: 'desc' } };
    if (orderBy) {
      sorter = this.getSorter({ orderBy, sortType });
    }
    query.aggs = {
      results: {
        terms: {
          field: 'id.keyword',
          size: AGGREGATION_DEFAULTS.TERMS_MAX_SIZE,
        },
        aggs: {
          objects: {
            top_hits: {
              sort: [
                {
                  'date.keyword': { order: 'asc' },
                },
              ],
              size: 1,
            },
          },
          score: {
            max: {
              script: {
                source: '_score',
              },
            },
          },
          objects_bucket_sort: {
            bucket_sort: {
              sort: [sorter],
              size: limit || QUERY_DEFAULTS.SIZE,
              from: this.formatFromValue(page),
            },
          },
        },
      },
    };
  }

  /**
   * Constructs array of terms filter objects from filters
   *
   * @private
   * @param {Partial<LearningObjectSearchQuery>} filters [Object containing filters to be applied to set]
   * @returns {TermsQuery[]}
   * @memberof ElasticSearchDriver
   */
  private convertQueryFiltersToTerms(
    filters: Partial<LearningObjectSearchQuery>,
  ): TermsQuery[] {
    const termsQueries: TermsQuery[] = [];
    Object.keys(filters).forEach(objectKey => {
      const termBody: { [property: string]: string[] } = {};
      termBody[`${objectKey}`] = filters[objectKey];
      termsQueries.push({ terms: termBody });
    });
    return termsQueries;
  }

  /**
   * Executes query on the Learning Object index and returns LearningObjectSearchResult
   *
   * @private
   * @param {ElasticSearchQuery} query [Query to be performed don the Learning Objects index]
   * @returns {Promise<SearchResponse<Partial<LearningObject>>>}
   * @memberof ElasticSearchDriver
   */
  private executeQuery(
    query: ElasticSearchQuery,
  ): Promise<SearchResponse<Partial<LearningObject>>> {
    return new Promise<SearchResponse<Partial<LearningObject>>>(
      (resolve, reject) => {
        request({
          uri: INDEX_URI(LEARNING_OBJECT_INDEX),
          json: true,
          body: query,
        })
          .then(resolve)
          .catch(this.transformRequestError)
          .catch((e: Error) => reject(e));
      },
    );
  }

  /**
   *  Converts ElasticSearch SearchResponse hits results to LearningObjectSearchResult
   *
   * @private
   * @param {SearchResponse<Partial<LearningObject>>} results
   * @returns {{ total: number; objects: LearningObject[] }}
   */
  private convertHitsToLearningObjectSearchResult(
    results: SearchResponse<Partial<LearningObject>>,
  ): LearningObjectSearchResult {
    const total = results.hits.total;
    const hits = results.hits.hits;
    const objects: LearningObjectSummary[] = hits.map(doc =>
      this.mapLearningObjectToSummary(doc._source),
    );
    return { total, objects };
  }

  /**
   *  Converts ElasticSearch SearchResponse aggregation to LearningObjectSearchResult
   *
   * @private
   * @param {SearchResponse<Partial<LearningObject>>} results
   * @returns {{ total: number; objects: LearningObject[] }}
   */
  private convertAggregationToLearningObjectSearchResult(
    results: SearchResponse<Partial<LearningObject>>,
  ): LearningObjectSearchResult {
    const total = results.hits.total;
    const aggregationResults = results.aggregations.results;
    const buckets = aggregationResults.buckets;
    const objects: LearningObjectSummary[] = buckets.map(
      (bucket: {
        objects: { hits: { hits: [{ _source: Partial<LearningObject> }] } };
      }) =>
        this.mapLearningObjectToSummary(bucket.objects.hits.hits[0]._source),
    );
    return { total, objects };
  }

  /**
   * Converts partial ElasticSearch LearningObject type into LearningObjectSummary
   *
   * @private
   * @param {Partial<LearningObject>} object [The document data to convert to AuthorSummary]
   * @returns {LearningObjectSummary}
   * @memberof ElasticSearchLearningObjectDatastore
   */
  private mapLearningObjectToSummary(
    object: Partial<LearningObject>,
  ): LearningObjectSummary {
    return {
      id: object.id,
      author: this.mapAuthorToSummary(object.author),
      collection: object.collection,
      contributors: object.contributors.map(this.mapAuthorToSummary),
      date: object.date,
      description: object.description,
      length: object.length,
      name: object.name,
      status: object.status,
    };
  }

  /**
   * Converts Partial ElasticSearch User type into AuthorSummary
   *
   * @private
   * @param {Partial<User>} author [The document data to convert to AuthorSummary]
   * @returns {AuthorSummary}
   * @memberof ElasticSearchLearningObjectDatastore
   */
  private mapAuthorToSummary(author: Partial<User>): AuthorSummary {
    return {
      id: author.id,
      name: author.name,
      organization: author.organization,
    };
  }

  /**
   * Transforms errors from `request-promise` to service specific error types
   *
   * @private
   * @param {RequestError} e [The error object thrown]
   * @param {string} message [Custom error message]
   * @memberof HttpLearningObjectGateway
   */
  private transformRequestError(e: RequestError, message?: string) {
    if (e instanceof StatusCodeError) {
      switch (e.statusCode) {
        case 400:
          throw new ResourceError(
            message || 'Unable to load resource',
            ResourceErrorReason.BAD_REQUEST,
          );
        case 401:
          throw new ResourceError(
            message || 'Invalid access',
            ResourceErrorReason.INVALID_ACCESS,
          );
        case 404:
          throw new ResourceError(
            message || 'Unable to load resource',
            ResourceErrorReason.NOT_FOUND,
          );
        case 500:
          throw new ServiceError(ServiceErrorReason.INTERNAL);
        default:
          break;
      }
    }
    throw new ServiceError(ServiceErrorReason.INTERNAL);
  }
}
