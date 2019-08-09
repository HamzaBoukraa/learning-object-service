import { Db } from 'mongodb';
import { UserLearningObjectDatastore } from '../../../../interfaces/UserLearningObjectDatastore';
import { MongoConnector } from '../../../../../shared/Mongo/MongoConnector';
import { ReleasedUserLearningObjectSearchQuery, LearningObjectSummary, UserLearningObjectSearchQuery, CollectionAccessMap, LearningObjectDocument } from '../../../../../shared/types';
import { QueryCondition } from '../../../../../shared/interfaces/DataStore';
import { COLLECTIONS } from '../../../../../drivers/MongoDriver';
import { LearningObject } from '../../../../../shared/entity';


export class MongoDBLearningObjectDatastore implements UserLearningObjectDatastore {
    private db: Db;
    constructor() {
        this.db = MongoConnector.client().db('onion');
    }

    /**
     * @inheritdoc
     *
     * @param {LearningObjectQuery} query query containing  for field searching
     * @param {string} username username of an author in CLARK
     */
    async searchReleasedUserObjects(
        query: ReleasedUserLearningObjectSearchQuery,
        username: string,
    ): Promise<LearningObjectSummary[]> {
    const { text } = query;
        const authorID = await this.findUserId(username);
        const searchQuery: { [index: string]: any } = {
            authorID,
        };
        if (text) {
            searchQuery.$or = searchQuery.$or || [];
            searchQuery.$or.push(
            { $text: { $search: text } },
            { name: RegExp(sanitizeRegex(text), 'gi') },
            );
        }
        const resultSet = await this.db
            .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
            .find<LearningObjectDocument>(searchQuery)
            .toArray();
        return Promise.all(
            resultSet.map(async learningObject =>
            this.generateReleasedLearningObjectSummary(learningObject),
            ),
        );
    }

    /**
     * Performs aggregation to join the users objects from the released and working collection before
     * searching and filtering based on collectionRescticions, text or explicitly defined statuses. If collectionRestrictions are
     * Defined, orConditions with statuses are built and the actual status filter will not be used or applied. This only occurs for reviewers
     * and curators. Text searches are are not affected by collection restructions or the 'orConditions'.
     *
     * @param {UserLearningObjectSearchQuery} query query containing status and text for field searching
     * @param {string} username username of an author in CLARK
     * @param {QueryCondition} conditions Array containing a reviewer or curators requested collections.
     *
     * @returns {LearningObjectSummary[]}
     * @memberof MongoDriver
     */
    async searchAllUserObjects(
        query: UserLearningObjectSearchQuery,
        username: string,
        collectionRestrictions?: CollectionAccessMap,
    ): Promise<LearningObjectSummary[]> {
        const { revision, status, text } = query;
        const authorID = await this.findUserId(username);

        let orConditions: QueryCondition[] = [];
        if (collectionRestrictions) {
        const conditions: QueryCondition[] = this.buildCollectionQueryConditions(
            collectionRestrictions,
        );
        orConditions = this.buildQueryConditions(conditions);
        }

        const searchQuery: { [index: string]: any } = {
        authorID,
        };
        if (revision != null) {
        searchQuery.revision = revision;
        }
        if (text) {
        searchQuery.$or = searchQuery.$or || [];
        searchQuery.$or.push(
            { $text: { $search: text } },
            { name: RegExp(sanitizeRegex(text), 'gi') },
        );
        }

        const pipeline = this.buildAllObjectsPipeline({
        searchQuery,
        orConditions,
        status,
        hasText: !!text,
        });

        const resultSet = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .aggregate<{
            objects: LearningObjectDocument[];
            total: [{ total: number }];
        }>(pipeline)
        .toArray();
        const learningObjects: LearningObjectSummary[] = await Promise.all(
        resultSet[0].objects.map(learningObject => {
            return learningObject.status === LearningObject.Status.RELEASED
            ? this.generateReleasedLearningObjectSummary(learningObject)
            : this.generateLearningObjectSummary(learningObject);
        }),
        );

        return learningObjects;
    }

  /**
   * Constructs aggregation pipeline for searching all objects with pagination and sorting By matching learning obejcts based on
   * queries provided, then joining the working and released collection together, adding the hasRevision flag to released learning object based on
   * the status of the working object, removing duplicates then returns a filtered and sorted superset of working and released learning objects.
   *
   * Status filter match stage is applied after initial match stage and creation of the super set in order to avoid filtering out
   * Learning Objects in the released collection.
   * ie. status filter = ['released']; Learning Object A is unreleased in `objects` collection and exists in the `released-objects` collection
   * if this was applied before the collection joining, Learning Object A would not be returned.
   *
   * @private
   * @param {({
   *     searchQuery?: any;
   *     orConditions?: any[];
   *     hasText?: boolean;
   *     page?: number;
   *     limit?: number;
   *     orderBy?: string;
   *     sortType?: 1 | -1;
   *   })} params
   * @returns {any[]}
   * @memberof MongoDriver
   */
  private buildAllObjectsPipeline({
    searchQuery,
    orConditions,
    hasText,
    status,
    page,
    limit,
    orderBy,
    sortType,
  }: {
    searchQuery?: any;
    orConditions?: any[];
    hasText?: boolean;
    status?: string[];
    page?: number;
    limit?: number;
    orderBy?: string;
    sortType?: 1 | -1;
  }): any[] {
    let matcher: any = { ...searchQuery };
    if (orConditions && orConditions.length) {
      matcher.$or = matcher.$or || [];
      matcher.$or.push(...orConditions);
    }

    const match = { $match: { ...matcher } };
    // Unwind the modified array to the root level at the end of every stage.
    const unWindArrayToRoot = [
      { $unwind: '$objects' },
      {
        $replaceRoot: { newRoot: '$objects' },
      },
    ];
    // perform a lookup on the Released collection by ID and assign two variables 'Object_id' and 'object_status' that will be used in this stage
    const joinCollections = {
      $lookup: {
        from: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
        let: { object_id: '$_id', object_status: '$status' },
        pipeline: [
          {
            // match Released objects to working objects ID.
            $match: {
              $expr: { $and: [{ $eq: ['$_id', '$$object_id'] }] },
            },
          },
          {
            // add the hasRevision Field to learning objects, set false if the working copy is released, true otherwise.
            $addFields: {
              hasRevision: {
                $cond: [
                  {
                    $ne: ['$$object_status', LearningObject.Status.RELEASED],
                  },
                  true,
                  false,
                ],
              },
            },
          },
        ],
        // store all released objects under a 'released' array.
        as: 'released',
      },
    };

    // create a large filtered collection of learning objects with duplicates.
    const createSuperSet = [
      { $unwind: { path: '$released', preserveNullAndEmptyArrays: true } },
      {
        // group released objects and with their working copy if one exists.
        $group: {
          _id: 1,
          objects: { $push: '$$ROOT' },
          released: { $push: '$released' },
        },
      },
      {
        // combine objects and released arrays and store under 'objects[]'.
        $project: {
          objects: { $concatArrays: ['$objects', '$released'] },
        },
      },
      ...unWindArrayToRoot,
    ];

    let statusFilterMatch: [
      { $match: { $or: [{ status: { $in: string[] } }] } }
    ] = [] as any;
    if (status) {
      statusFilterMatch[0] = {
        $match: {
          $or: [
            {
              status: { $in: status },
            },
          ],
        },
      };
    }

    // filter and remove duplicates after grouping the objects by ID.
    const removeDuplicates = [
      {
        $group: {
          _id: '$_id',
          objects: { $push: '$$ROOT' },
        },
      },
      {
        // If the objects array has one learning object, project it,
        // otherwise filter and project the object that contains a 'hasRevision' field.
        $project: {
          objects: {
            $cond: [
              { $eq: [{ $size: '$objects' }, 1] },
              { $arrayElemAt: ['$objects', 0] },
              {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: '$objects',
                      as: 'object',
                      cond: {
                        $or: [
                          { $eq: ['$$object.hasRevision', true] },
                          { $eq: ['$$object.hasRevision', false] },
                        ],
                      },
                    },
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
      // unwind and replace all arrays with objects.
      {
        $replaceRoot: {
          newRoot: '$objects',
        },
      },
    ];

    const { sort, paginate } = this.buildAggregationFilters({
      page,
      limit,
      hasText,
      orderBy,
      sortType,
    });

    const pipeline = [
      match,
      joinCollections,
      ...createSuperSet,
      ...statusFilterMatch,
      ...removeDuplicates,
      ...sort,
      {
        $facet: {
          objects: paginate,
          total: [
            {
              $count: 'total',
            },
          ],
        },
      },
    ];

    return pipeline;
  }

  /**
   * Builds sort and pagination filters for aggregation pipeline
   *
   * @private
   * @param {{
   *     page?: number;
   *     limit?: number;
   *     hasText?: boolean;
   *     orderBy?: string;
   *     sortType?: number;
   *   }} params
   * @returns {{ sort: any[]; paginate: any[] }}
   * @memberof MongoDriver
   */
   private buildAggregationFilters(params: {
     page?: number;
     limit?: number;
     hasText?: boolean;
     orderBy?: string;
     sortType?: number;
   }): { sort: [{ $sort: { [index: string]: any } }]; paginate: any[] } {
     let { page, limit, hasText, orderBy, sortType } = params;
     let paginate: {
       [index: string]: number;
     }[] = [{ $skip: 0 }];
     page = this.formatPage(page);
     const skip = this.calcSkip({ page, limit });
     // Paginate
     if (skip != null && limit) {
       paginate = [{ $skip: skip }, { $limit: limit }];
     } else if (skip == null && limit) {
       paginate = [{ $limit: limit }];
     }
     // @ts-ignore Sort must be initialized to modify
     const sort: [{ $sort: { [index: string]: any } }] = [];
     if (hasText) {
       sort[0] = { $sort: { score: { $meta: 'textScore' } } };
     }
     // Apply orderBy
     if (orderBy) {
       const orderBySorter = {};
       orderBySorter[orderBy] = sortType ? sortType : 1;
       sort[0] = { $sort: orderBySorter };
     }
     return { sort, paginate };
   }

  /**
   * Converts QueryConditions to valid Mongo conditional syntax
   *
   * @private
   * @param {QueryCondition[]} conditions
   * @returns
   * @memberof MongoDriver
   */
  private buildQueryConditions(conditions: QueryCondition[]) {
    const orConditions: any[] = [];
    conditions.forEach(condition => {
      const query = {};
      const conditionKeys = Object.keys(condition);
      for (const key of conditionKeys) {
        const value = condition[key];
        if (Array.isArray(value)) {
          query[key] = { $in: value };
        } else {
          query[key] = value;
        }
      }
      orConditions.push(query);
    });
    return orConditions;
  }

  /**
   * Builds QueryConditions based on requested collections and collectionAccessMap
   *
   * @private
   * @static
   * @param {CollectionAccessMap} collectionAccessMap
   * @returns {QueryCondition[]}
   * @memberof LearningObjectInteractor
   */
  private buildCollectionQueryConditions(
    collectionAccessMap: CollectionAccessMap,
  ): QueryCondition[] {
    const conditions: QueryCondition[] = [];

    const mapKeys = Object.keys(collectionAccessMap);
    for (const key of mapKeys) {
      const status = collectionAccessMap[key];
      conditions.push({ collection: key, status });
    }
    return conditions;
  }

}
