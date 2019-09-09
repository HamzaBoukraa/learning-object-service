import { Cursor, Db, MongoClient, ObjectID } from 'mongodb';
import { DataStore } from '../shared/interfaces/interfaces';
import {
  Filters,
  LearningObjectCollection,
  ReleasedLearningObjectQuery,
  QueryCondition,
  LearningObjectQuery,
  ParentLearningObjectQuery,
} from '../shared/interfaces/DataStore';
import * as ObjectMapper from './Mongo/ObjectMapper';
import {
  LearningObjectMetadataUpdates,
  LearningObjectDocument,
  UserDocument,
  LearningOutcomeDocument,
  StandardOutcomeDocument,
  LearningObjectSummary,
  ReleasedUserLearningObjectSearchQuery,
  UserLearningObjectSearchQuery,
  CollectionAccessMap,
  LearningObjectChildSummary,
} from '../shared/types';
import { LearningOutcomeMongoDatastore } from '../LearningOutcomes/datastores/LearningOutcomeMongoDatastore';
import {
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from '../LearningOutcomes/types';
import { LearningObjectStatStore } from '../LearningObjectStats/LearningObjectStatStore';
import { LearningObjectStats } from '../LearningObjectStats/LearningObjectStatsInteractor';
import { lengths } from '@cyber4all/clark-taxonomy';
import { LearningObjectDataStore } from '../LearningObjects/drivers/LearningObjectDatastore';
import { ChangeLogDocument } from '../shared/types/changelog';
import { ModuleChangelogDataStore } from '../Changelogs/ModuleChangelogDatastore';
import {
  ResourceError,
  ResourceErrorReason,
  ServiceError,
  ServiceErrorReason,
} from '../shared/errors';
import { reportError } from '../shared/SentryConnector';
import { LearningObject, LearningOutcome, User } from '../shared/entity';
import { MongoConnector } from '../shared/Mongo/MongoConnector';
import {
  mapLearningObjectToSummary,
  mapChildLearningObjectToSummary,
} from '../shared/functions';
import {
  ReleasedLearningObjectDocument,
  OutcomeDocument,
} from '../shared/types/learning-object-document';
import { LearningObjectUpdates } from '../shared/types/learning-object-updates';

export enum COLLECTIONS {
  USERS = 'users',
  LEARNING_OBJECTS = 'objects',
  RELEASED_LEARNING_OBJECTS = 'released-objects',
  LEARNING_OUTCOMES = 'learning-outcomes',
  STANDARD_OUTCOMES = 'outcomes',
  LO_COLLECTIONS = 'collections',
  MULTIPART_STATUSES = 'multipart-upload-statuses',
  CHANGELOG = 'changelogs',
  SUBMISSIONS = 'submissions',
}

export class MongoDriver implements DataStore {
  learningOutcomeStore: LearningOutcomeMongoDatastore;
  statStore: LearningObjectStatStore;
  learningObjectStore: LearningObjectDataStore;
  changelogStore: ModuleChangelogDataStore;

  private mongoClient: MongoClient;
  private db: Db;

  private constructor() {}

  static async build(dburi: string) {
    const driver = new MongoDriver();
    // FIXME: This is here to prevent existing tests that use this class from
    // breaking with the introduction of the MongoConnector
    if (!MongoConnector.client()) {
      await MongoConnector.open(dburi);
    }
    driver.mongoClient = MongoConnector.client();
    driver.db = driver.mongoClient.db();
    await driver.initializeModules();
    return driver;
  }

  async disconnect() {
    return MongoConnector.disconnect();
  }

  /**
   * Initializes module stores
   *
   * @memberof MongoDriver
   */
  initializeModules() {
    this.learningOutcomeStore = new LearningOutcomeMongoDatastore(this.db);
    this.statStore = new LearningObjectStatStore(this.db);
    this.learningObjectStore = new LearningObjectDataStore(this.db);
    this.changelogStore = new ModuleChangelogDataStore(this.db);
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
    //TODO: UPDATE INTERACTOR LOGIC TO ALLOW QUERIES FOR RELEASED LEARNING OBJECTS IN THE OBJECTS COLLECTION..
    //side-note: we may end up pointing released logic to elastic search as we're already doing for normal released search. check types and current driver logic.
    const { text } = query;
    const authorID = await this.findUserId(username);
    const searchQuery: { [index: string]: any } = {
      authorID,
      status: LearningObject.Status.RELEASED,
    };
    if (text) {
      searchQuery.$or = searchQuery.$or || [];
      searchQuery.$or.push(
        { $text: { $search: text } },
        { name: RegExp(sanitizeRegex(text), 'gi') },
      );
    }
    const resultSet = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .find<ReleasedLearningObjectDocument>(searchQuery)
      .toArray();
    return Promise.all(
      resultSet.map(async learningObject =>
        this.generateLearningObjectSummary(learningObject),
      ),
    );
  }

  /**
   * Checks if Learning Object in released collection has a copy in the objects collection that has a status of not released
   *
   * @param {string} learningObjectId [The id of the Learning Object to check for an existing revision of]
   * @returns {Promise<boolean>}
   * @memberof MongoDriver
   */
  async learningObjectHasRevision(learningObjectId: string): Promise<boolean> {
    const revision = this.db.collection(COLLECTIONS.LEARNING_OBJECTS).findOne(
      {
        _id: learningObjectId,
        status: { $ne: LearningObject.Status.RELEASED },
      },
      {
        projection: {
          _id: 1,
        },
      },
    );
    if (revision) {
      return true;
    }
    return false;
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
        return this.generateLearningObjectSummary(learningObject);
      }),
    );

    return learningObjects;
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

  /**
   * @inheritdoc
   *
   * @param {string} id [Id of the Learning Object to fetch materials of]
   * @returns {Promise<LearningObject.Material>}
   * @memberof MongoDriver
   */
  async fetchReleasedMaterials(id: string): Promise<LearningObject.Material> {
    const doc = await this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .findOne({ _id: id }, { projection: { _id: 0, materials: 1 } });
    if (doc) {
      return doc.materials;
    }
    return null;
  }
  /**
   * @inheritdoc
   *
   * @param {string} id [Id of the Learning Object]
   * @param {string} fileId [Id of the file]
   * @returns {Promise<LearningObject.Material.File>}
   * @memberof MongoDriver
   */
  async fetchReleasedFile({
    id,
    fileId,
  }: {
    id: string;
    fileId: string;
  }): Promise<LearningObject.Material.File> {
    const results = await this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .aggregate([
        {
          $match: {
            _id: id,
          },
        },
        {
          $unwind: {
            path: '$materials.files',
          },
        },
        {
          $match: {
            'materials.files.id': fileId,
          },
        },
        {
          $project: {
            _id: 0,
            file: '$materials.files',
          },
        },
      ])
      .toArray();
    if (results && results[0]) {
      return results[0].file;
    }
    return null;
  }
  /**
   * @inheritdoc
   *
   * @param {string} id [Id of the Learning Object]
   * @returns {Promise<LearningObject.Material.File[]>}
   * @memberof MongoDriver
   */
  async fetchReleasedFiles(
    id: string,
  ): Promise<LearningObject.Material.File[]> {
    const doc = await this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .findOne({ _id: id }, { projection: { _id: 0, 'materials.files': 1 } });
    if (doc) {
      return doc.materials.files;
    }
    return null;
  }

  /**
   * @inheritdoc
   *
   * Searches both collections for Learning Object matching the specified id and revision number
   *
   * *** Example ***
   * `id`='exampleId', `revision`=1
   * If revision 1 of Learning Object exampleId was released, it's latest version will be stored in the released objects collection
   * If revision 1 is still be drafted or is in review, it will only exist in the working objects collection
   * @param {string} id [Id of the Learning Object]
   * @param {number} revision [Revision number of the Learning Object]
   * @param {User} author [User object of Learning Object author]
   * @param {boolean} summary [Boolean indicating whether or not to return a LearningObject or LearningObjectSummary]
   * @returns {Promise<LearningObject | LearningObjectSummary>}
   * @memberof MongoDriver
   */
  async fetchLearningObjectRevision({
    id,
    revision,
    author,
  }: {
    id: string;
    revision: number;
    author?: User;
  }): Promise<LearningObjectSummary> {
    const doc = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne({ _id: id, revision });
    if (doc) {
        return this.generateLearningObjectSummary(doc);
      }
    return null;
  }

  /**
   * Fetches Learning Object's author's username through an aggregation by matching the id of tje learning object provided,
   * and using that information to perform a lookup on the users collection to grab the author and return their username
   *
   * @param {string} id the id of the Learning Object.
   * @returns {Promise<string>} the username of the author.
   * @memberof MongoDriver
   */
  async fetchLearningObjectAuthorUsername(id: string): Promise<string> {
    const results = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .aggregate([
        // match the id
        { $match: { _id: id } },
        {
          // search the Users collection for the author based on Id and save as 'author' array.
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'authorID',
            foreignField: '_id',
            as: 'author',
          },
        },
        // unwind the array to an object.
        { $unwind: { path: '$author' } },
        // display only the author's username.
        { $project: { 'author.username': 1 } },
        // make the author's username the main document.
        { $replaceRoot: { newRoot: '$author' } },
      ])
      .toArray();
    const user = results[0];
    if (user) {
      return user.username;
    }
    return null;
  }

  /**
   * Inserts object into released objects collection or overwrites if exists
   *
   * @param {LearningObject} object
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  async addToReleased(object: LearningObject): Promise<void> {
    const doc = await this.documentReleasedLearningObject(object);
    await this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .replaceOne({ _id: object.id }, doc, { upsert: true });
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
      matcher.$or.push({
        status: { $in: status },
      });
    }

    const match = { $match: { ...matcher } };

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
   * Performs update on multiple LearningObject documents
   *
   * @param {{
   *     ids: string[];
   *     updates: LearningObjectMetadataUpdates;
   *   }} params
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  async updateMultipleLearningObjects(params: {
    ids: string[];
    updates: LearningObjectMetadataUpdates;
  }): Promise<void> {
    await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .update({ _id: { $in: params.ids } }, { $set: params.updates });
  }
  /**
   * Returns array of ids associated with child's parent objects
   *
   * @param {{ childId: string }} params
   * @returns {Promise<string[]>}
   * @memberof MongoDriver
   */
  async findParentObjectIds(params: { childId: string }): Promise<string[]> {
    const docs = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .find<{ _id: string }>(
        { children: params.childId },
        { projection: { _id: 1 } },
      )
      .toArray();
    if (docs) {
      return docs.map(doc => doc._id);
    }
    return [];
  }

  /**
   * Returns a single parent id for a given child object id
   * This is used for checking if a learning object is a top level object
   *
   * @param {{ childId: string }} params
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async findParentObjectId(params: { childId: string }): Promise<string> {
    const docs = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .find<{ _id: string }>(
        { children: params.childId },
        { projection: { _id: 1 } },
      )
      .limit(1)
      .toArray();
    if (docs[0]) {
      const id = docs.map(doc => doc._id)[0];
      return id;
    }
    return null;
  }

  /**
   * Returns array of ids associated with the learning object's children objects
   * @param {{ parentId: string }} params
   * @return {Promise<string[]>}
   * @memberof MongoDriver
   */
  async findChildObjectIds(params: { parentId: string }): Promise<string[]> {
    const children = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne<{ children: string[] }>(
        { _id: params.parentId },
        { projection: { children: 1 } },
      );

    if (children) {
      const childrenIDs = children.children;
      return childrenIDs;
    }
    return [];
  }
  /**
   *  Fetches all child objects for object with given parent id and status starting with a match, then performing a
   *  lookup to grab the children of the specified parent and returning only the children
   *
   * @param {string} id
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async loadChildObjects(params: {
    id: string;
    full?: boolean;
    status: string[];
    collection?: string;
  }): Promise<LearningObjectSummary[]> {
    const { id, full, status, collection } = params;
    const matchQuery: { [index: string]: any } = {
      $match: { _id: id },
    };

    const findChildren: {
      $graphLookup: {
        from: string;
        startWith: string;
        connectFromField: string;
        connectToField: string;
        as: string;
        maxDepth: number;
        restrictSearchWithMatch?: { [index: string]: any };
      };
    } = {
      $graphLookup: {
        from: collection || COLLECTIONS.LEARNING_OBJECTS,
        startWith: '$children',
        connectFromField: 'children',
        connectToField: '_id',
        as: 'objects',
        maxDepth: 0,
      },
    };
    if (status) {
      findChildren.$graphLookup.restrictSearchWithMatch = {
        status: { $in: status },
      };
    }

    const docs = await this.db
      .collection<{ objects: LearningObjectDocument[] }>(
        collection || COLLECTIONS.LEARNING_OBJECTS,
      )
      .aggregate([
        // match based on id's and status array if given.
        matchQuery,
        findChildren,
        // only return children.
        { $project: { _id: 0, objects: '$objects' } },
      ])
      .toArray();
    if (docs[0]) {
      const objects = docs[0].objects;
      return this.bulkGenerateLearningObjectSummaries(objects);
    }
    return [];
  }

  /**
   * Loads released child objects
   *
   * @param {{
   *     id: string;
   *     full?: boolean;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async loadReleasedChildObjects(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObjectSummary[]> {
    return this.loadChildObjects({
      ...params,
      collection: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
      status: [LearningObject.Status.RELEASED],
    });
  }

  /**
   * @inheritdoc
   *
   * Performs lookup on released objects collection to fetch all metadata for all child Learning Objects that belong to a
   * working parent Learning Object
   *
   * @param {string} id [The id of the working parent Learning Object]
   * @param {boolean} full [Whether or not to load the full children Learning Objects]
   *
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async loadWorkingParentsReleasedChildObjects({
    id,
    full,
  }: {
    id: string;
  }): Promise<LearningObjectSummary[]> {
    const docs = await this.db
      .collection<{ objects: LearningObjectDocument[] }>(
        COLLECTIONS.LEARNING_OBJECTS,
      )
      .aggregate([
        { $match: { _id: id } },
        {
          // grab the released children of learning objects
          $lookup: {
            from: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
            localField: 'children',
            foreignField: '_id',
            as: 'objects',
          },
        },
        // only return children.
        { $project: { _id: 0, objects: '$objects' } },
      ])
      .toArray();
    if (docs[0]) {
      const objects = docs[0].objects;
      return this.bulkGenerateLearningObjects(objects, full);
    }
    return [];
  }

  async getLearningObjectMaterials(params: {
    id: string;
  }): Promise<LearningObject.Material> {
    const doc = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne({ _id: params.id }, { projection: { materials: 1 } });
    if (doc) {
      return doc.materials;
    }
  }

  // LearningOutcome Ops
  insertLearningOutcome(params: {
    source: string;
    outcome: Partial<LearningOutcome>;
  }): Promise<string> {
    return this.learningOutcomeStore.insertLearningOutcome(params);
  }
  getLearningOutcome(params: { id: string }): Promise<LearningOutcome> {
    return this.learningOutcomeStore.getLearningOutcome(params);
  }
  getAllLearningOutcomes(params: {
    source: string;
  }): Promise<LearningOutcome[]> {
    return this.learningOutcomeStore.getAllLearningOutcomes(params);
  }
  updateLearningOutcome(params: {
    id: string;
    updates: LearningOutcomeUpdate & LearningOutcomeInsert;
  }): Promise<LearningOutcome> {
    return this.learningOutcomeStore.updateLearningOutcome(params);
  }
  deleteLearningOutcome(params: { id: string }): Promise<void> {
    return this.learningOutcomeStore.deleteLearningOutcome(params);
  }
  deleteAllLearningOutcomes(params: { source: string }): Promise<void> {
    return this.learningOutcomeStore.deleteAllLearningOutcomes(params);
  }

  /////////////
  // INSERTS //
  /////////////

  /**
   * Insert a learning object into the database.
   * @async
   *
   * @param {LearningObjectInsert} object
   *
   * @returns {LearningObjectID} the database id of the new record
   */
  async insertLearningObject(object: LearningObject): Promise<string> {
    try {
      const doc = await this.documentLearningObject(object);
      // insert object into the database
      await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).insertOne(doc);
      return doc._id;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async fetchRecentChangelog(params: {
    learningObjectId: string;
  }): Promise<ChangeLogDocument> {
    return this.changelogStore.getRecentChangelog({
      learningObjectId: params.learningObjectId,
    });
  }

  async deleteChangelog(params: { learningObjectId: string }): Promise<void> {
    return this.changelogStore.deleteChangelog({
      learningObjectId: params.learningObjectId,
    });
  }

  async fetchAllChangelogs(params: {
    learningObjectId: string;
  }): Promise<ChangeLogDocument[]> {
    return await this.changelogStore.fetchAllChangelogs({
      learningObjectId: params.learningObjectId,
    });
  }

  /**
   * Allows filtering change logs by date of a specified learning object
   *
   * @param {string} learningObjectId The id of the learning object that the requested changelog belongs to
   * @param {string} date The date the changelog was created
   */
  async fetchChangelogsBeforeDate(params: {
    learningObjectId: string;
    date: string;
  }): Promise<ChangeLogDocument[]> {
    return await this.changelogStore.fetchChangelogsBeforeDate({
      learningObjectId: params.learningObjectId,
      date: params.date,
    });
  }

  fetchRecentChangelogBeforeDate(params: {
    learningObjectId: string;
    date: string;
  }): Promise<ChangeLogDocument> {
    return this.changelogStore.fetchRecentChangelogBeforeDate(params);
  }

  /**
   * Inserts a child id into a learning object's children array if the child object
   * exists in the LearningObject collection.
   *
   * @async
   * @param {string} parentId The database ID of the parent Learning Object
   * @param {string} childId The database ID of the child Learning Object
   * @memberof MongoDriver
   */
  async setChildren(parentId: string, children: string[]): Promise<any> {
    try {
      const collection = this.db.collection(COLLECTIONS.LEARNING_OBJECTS);

      const parentObject = await collection.findOne({ _id: parentId });
      const childrenObjects = await collection
        .find({ _id: { $in: children } })
        .toArray();

      // check that the same number of children objects were returned as ids were sent
      if (childrenObjects.length !== children.length) {
        return Promise.reject({
          message: `One or more of the children id's does not exist`,
          status: 404,
        });
      } else {
        if (!this.checkChildrenLength(parentObject, childrenObjects)) {
          // at least one of the children is of an equal or greater length than the parent
          return Promise.reject({
            message: `One or more of the children objects are of a length greater than or equal to the parent objects length`,
            status: 400,
          });
        }

        parentObject.children = children;

        // replace children array of parent with passed children array
        await this.db
          .collection(COLLECTIONS.LEARNING_OBJECTS)
          .findOneAndUpdate(
            { _id: parentId },
            { $set: { children } },
            { upsert: true },
          );
      }
    } catch (error) {
      console.log(error);
      return Promise.reject({
        message: `Problem inserting children into Object ${parentId}`,
        status: 500,
      });
    }
  }

  /**
   * Iterates the provided array of children objects and ensure that none of them are of an equal or greater length than the parent
   * @param {LearningObject} parent Learning object to which children will be added
   * @param {LearningObject[]} children Array of learning objects to be added as children to parent
   */
  private checkChildrenLength(
    parent: LearningObject,
    children: LearningObject[],
  ): boolean {
    const maxLengthIndex = lengths.indexOf(parent.length);

    for (let i = 0, l = children.length; i < l; i++) {
      if (lengths.indexOf(children[i].length) >= maxLengthIndex) {
        // this learning object is of an equal or greater length than the parent
        return false;
      }
    }

    return true;
  }

  /**
   * deletes a child id from a learning object's children array if the child object
   * exists in the children array.
   *
   * @async
   * @param {string} parentId The database ID of the parent Learning Object
   * @param {string} childId The database ID of the child Learning Object
   * @memberof MongoDriver
   */
  async deleteChild(parentId: string, childId: string) {
    try {
      await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .update({ _id: parentId }, { $pull: { children: childId } })
        .then(res => {
          return res.result.nModified > 0
            ? Promise.resolve()
            : Promise.reject({
                message: `${childId} is not a child of Object ${parentId}`,
                status: 404,
              });
        });
    } catch (error) {
      if (error.message && error.status) {
        return Promise.reject(error);
      }
      return Promise.reject({
        message: `Problem removing child ${childId} from Object ${parentId}`,
        status: 400,
      });
    }
  }

  /**
   * Retrieves parent objects that match the provided query parameters, allowing
   * the caller to identify Learning Object status and collection values.
   *
   * This function will aggregate both released and working copies of Learning Objects.
   * In the case that there is both a released copy and a working copy, the released copy
   * will be returned.
   *
   * @param {ParentLearningObjectQuery} query a collection of query parameters to filter the search by.
   * @returns {Promise<LearningObject[]>} the set of parent Learning Objects found.
   * @memberof MongoDriver
   */
  async fetchParentObjects({
    query,
    full,
    collection = COLLECTIONS.LEARNING_OBJECTS,
  }: {
    query: ParentLearningObjectQuery;
    full: boolean;
    collection: COLLECTIONS;
  }): Promise<LearningObject[]> {
    const matchQuery: { [index: string]: any } = { children: query.id };
    if (query.status) {
      matchQuery.status = { $in: query.status };
    }
    if (query.collections) {
      matchQuery.collection = { $in: query.collections };
    }

    const parents = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .aggregate([
        { $match: matchQuery },
        {
          $lookup: {
            from: 'released-objects',
            localField: '_id',
            foreignField: '_id',
            as: 'releasedCopy',
          },
        },
        {
          $project: {
            returnable: {
              $cond: {
                if: { $gt: [{ $size: '$releasedCopy' }, 0] },
                then: { $arrayElemAt: ['$releasedCopy', 0] },
                else: '$$ROOT',
              },
            },
          },
        },
        { $replaceRoot: { newRoot: '$returnable' } },
      ])
      .toArray();

    return this.bulkGenerateLearningObjects(parents);
  }

  /**
   * Fetches Parents of requested Learning Object from released collection
   *
   * @param {{
   *     query: ParentLearningObjectQuery;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async fetchReleasedParentObjects(params: {
    query: ParentLearningObjectQuery;
    full: boolean;
  }): Promise<LearningObject[]> {
    const { query, full } = params;
    const mongoQuery = { children: query.id, status: 'released' };

    const parentDocs = await this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .find<LearningObjectDocument>(mongoQuery)
      .toArray();
    return await this.bulkGenerateLearningObjects(parentDocs, full);
  }

  ///////////////////////////////////////////////////////////////////
  // EDITS - update without touching any foreign keys or documents //
  ///////////////////////////////////////////////////////////////////

  /**
   * Edit a learning object.
   * @async
   *
   * @param {LearningObjectID} id which document to change
   * @param {LearningObjectEdit} record the values to change to
   */
  async editLearningObject(params: {
    id: string;
    updates: LearningObjectUpdates;
  }): Promise<void> {
    await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .updateOne({ _id: params.id }, { $set: params.updates });
  }

  //////////////////////////////////////////
  // DELETIONS - will cascade to children //
  //////////////////////////////////////////

  /**
   * Remove a learning object (and its outcomes) from the database.
   * @async
   *
   * @param {LearningObjectID} id which document to delete
   */
  async deleteLearningObject(id: string): Promise<void> {
    try {
      // remove children references to this learning object from parent
      await this.deleteLearningObjectParentReferences(id);
      await this.deleteAllLearningOutcomes({ source: id });

      // now remove the object
      await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .deleteOne({ _id: id });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Remove a learning object (and its outcomes) from the database.
   * @async
   *
   * @param {LearningObjectID} id which document to delete
   */
  async deleteMultipleLearningObjects(ids: string[]): Promise<any> {
    // now remove objects from database
    return Promise.all(
      ids.map(async id => {
        return this.deleteLearningObject(id);
      }),
    );
  }

  /**
   * Iterates a user's learning objects and removes children references to the specified id
   * @param id represents the learning object whose references are to be removed
   */
  private async deleteLearningObjectParentReferences(id: string): Promise<any> {
    // remove references to learning object from parents
    return await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOneAndUpdate({ children: id }, { $pull: { children: id } });
  }

  ///////////////////////////
  // INFORMATION RETRIEVAL //
  ///////////////////////////

  async peek<T>(params: {
    query: { [index: string]: string };
    fields: { [index: string]: 0 | 1 };
  }): Promise<T> {
    if (params.query.id) {
      params.query._id = params.query.id;
      delete params.query.id;
    }
    const doc = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne(params.query, { projection: params.fields });
    if (doc) {
      doc.id = doc._id;
      delete doc._id;
    }
    return doc;
  }

  /**
   * Fetches Stats for Learning Objects
   *
   * @param {{ query: any }} params
   * @returns {Promise<Partial<LearningObjectStats>>}
   * @memberof MongoDriver
   */
  fetchStats(params: { query: any }): Promise<LearningObjectStats> {
    return this.statStore.fetchStats({ query: params.query });
  }

  /**
   * Get LearningObject IDs owned by User starting with match based on the username provided, then performing lookup on the
   * learning objects collection to grab the users learning objects.
   *
   * @param {string} username
   * @returns {string[]}
   * @memberof MongoDriver
   */
  async getUserObjects(username: string): Promise<string[]> {
    try {
      const objects = await this.db
        .collection<{ _id: string }>(COLLECTIONS.USERS)
        .aggregate([
          // match based on username given
          { $match: { username } },
          {
            // lookup the users learning objects based on the author's id.
            $lookup: {
              from: COLLECTIONS.LEARNING_OBJECTS,
              localField: '_id',
              foreignField: 'authorID',
              as: 'objects',
            },
          },
          // unwind learning object from array to object.
          { $unwind: '$objects' },
          // make the learning object the root of the document.
          { $replaceRoot: { newRoot: '$objects' } },
          // return only the ID.
          { $project: { _id: 1 } },
        ])
        .toArray();
      return objects.map(obj => obj._id);
    } catch (e) {
      reportError(e);
      throw new ServiceError(ServiceErrorReason.INTERNAL);
    }
  }

  /**
   * Look up a user by its login id.
   *
   * @deprecated This function is no longer supported, please use `findUserId` instead.
   *
   * @async
   *
   * @param {string} id the user's login id
   *
   * @returns {UserID}
   */
  async findUser(username: string): Promise<string> {
    try {
      const query = {};
      if (isEmail(username)) {
        query['email'] = username;
      } else {
        query['username'] = username;
      }
      const userRecord = await this.db
        .collection(COLLECTIONS.USERS)
        .findOne<UserDocument>(query, { projection: { _id: 1 } });
      if (!userRecord)
        return Promise.reject(
          new ResourceError(
            `Cannot find user with username ${username}`,
            ResourceErrorReason.NOT_FOUND,
          ),
        );
      return `${userRecord._id}`;
    } catch (e) {
      reportError(e);
      return Promise.reject(new ServiceError(ServiceErrorReason.INTERNAL));
    }
  }

  /**
   * @inheritdoc
   * @async
   *
   * @param {string} userIdentifier the user's username or email
   *
   * @returns {UserID}
   */
  async findUserId(userIdentifier: string): Promise<string> {
    const query = {};
    if (isEmail(userIdentifier)) {
      query['email'] = userIdentifier;
    } else {
      query['username'] = userIdentifier;
    }
    const userRecord = await this.db
      .collection(COLLECTIONS.USERS)
      .findOne<UserDocument>(query, { projection: { _id: 1 } });
    if (userRecord) {
      return `${userRecord._id}`;
    }
    return null;
  }

  /**
   * Look up a learning object by its author and name.
   * By default it will perform this query on the objects collection.
   * If collection param is passed then it will perform the query on specified collection
   *
   * @param {{
   *     authorId: string; [Id of the author]
   *     name: string; [name of the Learning Object]
   *     collection?: string; [DB collection to perform query on;]
   *   }} params
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async findLearningObject(params: {
    authorId: string;
    name: string;
    collection?: COLLECTIONS.RELEASED_LEARNING_OBJECTS;
  }): Promise<string> {
    const { authorId, name, collection } = params;
    const doc = await this.db
      .collection(collection || COLLECTIONS.LEARNING_OBJECTS)
      .findOne<LearningObjectDocument>(
        {
          authorID: authorId,
          name,
        },
        { projection: { _id: 1 } },
      );
    if (doc) {
      return doc._id;
    }
    return null;
  }

  /**
   * Looks up a released learning object by its author and name.
   *
   * @param {{
   *     authorId: string; [Id of the author]
   *     name: string; [name of the Learning Object]
   *   }} params
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async findReleasedLearningObject(params: {
    authorId: string;
    name: string;
  }): Promise<string> {
    return this.findLearningObject({
      ...params,
      collection: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
    });
  }

  /**
   * Look up a standard outcome by its tag.
   * @async
   *
   * @param {string} tag the outcome's unique identifier
   *
   * @returns {StandardOutcomeID}
   */
  async findMappingID(
    date: string,
    name: string,
    outcome: string,
  ): Promise<string> {
    try {
      const tag = date + '$' + name + '$' + outcome;
      const doc = await this.db
        .collection(COLLECTIONS.STANDARD_OUTCOMES)
        .findOne<StandardOutcomeDocument>({
          tag: tag,
        });
      if (!doc)
        return Promise.reject(
          'No mappings found with tag: ' + tag + ' in the database',
        );
      return Promise.resolve(doc._id);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetch the user document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {UserRecord}
   */
  async fetchUser(id: string): Promise<User> {
    try {
      const doc = await this.db
        .collection<UserDocument>(COLLECTIONS.USERS)
        .findOne({ _id: id });
      const user = ObjectMapper.generateUser(doc);
      return user;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetch the learning object document associated with the given id.
   * FIXME x 1000: clean this query up after files collection is created
   *
   * The query fetches the specified released learning object and sorts the files by date (newest first)
   * If the query fails, the function throws a 404 Resource Error.
   * @async
   *
   * @param id database id
   *
   * @returns {LearningObjectRecord}
   */
  async fetchLearningObject({
    id,
    full,
  }: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject> {
    const doc = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne({ _id: id });
    if (doc) {
      const author = await this.fetchUser(doc.authorID);
      return this.generateLearningObject(author, doc, full);
    }
    return null;
  }

  /**
   * Fetches released object through aggregation pipeline by performing a match based on the object id, finding the duplicate object in the
   * working collection, then checking the status of the duplicate to determine whether or not to set hasRevision to true or false.
   * FIXME x 1000: clean this query up after files collection is created
   *
   * The query fetches the specified released learning object and sorts the files by date (newest first)
   * If the query fails, the function throws a 404 Resource Error.
   * @param {{
   *     id: string;
   *     full?: boolean;
   *   }} params
   * @returns {Promise<LearningObject>}
   * @memberof MongoDriver
   */
  async fetchReleasedLearningObject(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject> {
    const results = await this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .aggregate([
        {
          // match learning object by params.id
          $match: { _id: params.id },
        },
        {
          $unwind: {
            path: '$materials.files',
            preserveNullAndEmptyArrays: true,
          },
        },
        { $sort: { 'materials.files.date': -1 } },
        { $addFields: { orderedFiles: '' } },
        {
          $group: {
            _id: '$_id',
            cuid: { $first: '$cuid' },
            orderedFiles: {
              $push: '$materials.files',
            },
            authorID: { $first: '$authorID' },
            name: { $first: '$name' },
            date: { $first: '$date' },
            length: { $first: '$length' },
            levels: { $first: '$levels' },
            goals: { $first: '$goals' },
            outcomes: { $first: '$outcomes' },
            materials: { $first: '$materials' },
            contributors: { $first: '$contributors' },
            collection: { $first: '$collection' },
            status: { $first: '$status' },
            description: { $first: '$description' },
            revision: { $first: '$revision' },
          },
        },
        // perform a lookup and store the working copy of the object under the "Copy" array.
        {
          $lookup: {
            from: 'objects',
            localField: '_id',
            foreignField: '_id',
            as: 'copy',
          },
        },
        // unwind copy from array to object so we can check certain fields.
        { $unwind: { path: '$copy', preserveNullAndEmptyArrays: true } },
        // if the copys' status differs from the released objects status, then the object has a revision.
        // so we add a the field 'hasRevision' with a true value
        {
          $addFields: {
            hasRevision: {
              $cond: [{ $ne: ['$copy.status', 'released'] }, true, false],
            },
          },
        },
        { $project: { copy: 0 } },
      ])
      .toArray();
    if (results && results[0]) {
      const object = results[0];
      object.materials.files = object.orderedFiles;
      delete object.orderedFiles;
      const author = await this.fetchUser(object.authorID);
      return this.generateReleasedLearningObject(author, object, params.full);
    }
    return null;
  }

  /**
   * Check if a learning object exists
   *
   * @param {string} learningObjectId The id of the specified learning object
   *
   * @returns {array}
   */
  async checkLearningObjectExistence(params: {
    learningObjectId: string;
    userId: string;
  }): Promise<LearningObject> {
    return await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).findOne({
      _id: params.learningObjectId,
      authorID: params.userId,
    });
  }

  /**
   * Fetches an object's status
   *
   * @param {string} id
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async fetchLearningObjectStatus(id: string): Promise<string> {
    try {
      const res = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOne({ _id: id }, { projection: { status: 1 } });

      if (res) {
        return res.status;
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetches an object's collection id
   *
   * @param {string} id
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async fetchLearningObjectCollection(id: string): Promise<string> {
    try {
      const res = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOne({ _id: id }, { projection: { collection: 1 } });

      if (res) {
        return res.collection;
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Converts array of LearningObjectDocuments to Learning Objects
   *
   * @private
   * @param {LearningObjectDocument[]} docs
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  private async bulkGenerateLearningObjects(
    docs: LearningObjectDocument[],
    full?: boolean,
  ): Promise<LearningObject[]> {
    return await Promise.all(
      docs.map(async doc => {
        const author = await this.fetchUser(doc.authorID);
        const learningObject = await this.generateLearningObject(
          author,
          doc,
          full,
        );
        return learningObject;
      }),
    );
  }

  /**
   * Fetches the learning object documents associated with the given ids.
   *
   * @param ids array of database ids
   *
   * @returns {Cursor<LearningObjectRecord>[]}
   */
  async fetchMultipleObjects(params: {
    ids: string[];
    status: string[];
    full?: boolean;
    orderBy?: string;
    sortType?: 1 | -1;
    collections?: string[];
    text?: string;
  }): Promise<LearningObject[]> {
    try {
      const query: any = {
        _id: { $in: params.ids },
      };

      if (params.collections) {
        query.$or = [
          { status: LearningObject.Status.RELEASED },
          {
            status: { $in: params.status },
            collection: { $in: params.collections },
          },
        ];
      } else {
        query.status = { $in: params.status };
      }
      if (params.text) {
        query.$or = query.$or || [];
        query.$or.push(
          { name: new RegExp(sanitizeRegex(params.text)) },
          { description: new RegExp(sanitizeRegex(params.text)) },
        );
      }
      let objectCursor = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .find<LearningObjectDocument>(query);

      objectCursor = this.applyCursorFilters(objectCursor, {
        orderBy: params.orderBy,
        sortType: params.sortType,
      });

      const docs = await objectCursor.toArray();

      const learningObjects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
        params.full,
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching LearningObjects: ${params.ids}. Error: ${e}`,
      );
    }
  }

  /**
   * Performs search on released objects collection based on query
   *
   * @param {ReleasedLearningObjectQuery} params
   * @returns {Promise<{ objects: LearningObject[]; total: number }>}
   * @memberof MongoDriver
   */
  async searchReleasedObjects(
    params: ReleasedLearningObjectQuery,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      const {
        author,
        text,
        length,
        level,
        guidelines,
        standardOutcomeIDs,
        name,
        collection,
        sortType,
        page,
        limit,
        orderBy,
        full,
      } = params;

      // Query for users
      const authors = await this.matchUsers(author, text);

      // Query by LearningOutcomes' mappings
      const learningObjectIds: string[] = await this.matchLearningObjectsByGuidelines(
        {
          guidelineIds: standardOutcomeIDs,
          guidelineSources: guidelines,
        },
      );

      let query: any = this.buildSearchQuery({
        text,
        authors,
        length,
        level,
        learningObjectIds,
        name,
        collection,
      });
      console.log('TCL: query', JSON.stringify(query));

      let objectCursor = await this.db
        .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
        .find<LearningObjectDocument>(query)
        .project({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });

      const total = await objectCursor.count();

      objectCursor = this.applyCursorFilters(objectCursor, {
        page: page,
        limit: limit,
        orderBy: orderBy,
        sortType: sortType,
      });

      const docs = await objectCursor.toArray();
      const objects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
        full,
      );

      return {
        objects,
        total,
      };
    } catch (e) {
      return Promise.reject('Error searching objects ' + e);
    }
  }

  /**
   * Builds query object for Learning Object search
   *
   * @private
   * @param {string} text
   * @param {string[]} authorIDs
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} learningObjectIds
   * @param {string} name
   * @returns
   * @memberof MongoDriver
   */
  private buildSearchQuery(params: {
    text?: string;
    authors?: { _id: string; username: string }[];
    status?: string[];
    length?: string[];
    level?: string[];
    learningObjectIds?: string[];
    name?: string;
    collection?: string[];
  }) {
    let query: any = <any>{};

    // Search By Text
    if (params.text || params.text === '') {
      query = this.buildTextSearchQuery({
        query,
        ...(params as any),
      } as any);
    } else {
      // Search by fields
      query = this.buildFieldSearchQuery({
        query,
        ...(params as any),
      });
    }
    return query;
  }

  /**
   * Builds Learning Object Query based on Fields
   *
   * @private
   * @param {string} name
   * @param {*} query
   * @param {{ _id: string; username: string }[]} authors
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} outcomeIDs
   * @returns
   * @memberof MongoDriver
   */
  private buildFieldSearchQuery({
    query,
    name,
    authors,
    status,
    length,
    level,
    learningObjectIds,
    collection,
  }: {
    query: any;
    name?: string;
    authors?: { _id: string; username: string }[];
    status?: string[];
    length?: string[];
    level?: string[];
    learningObjectIds?: string[];
    collection?: string[];
  }) {
    if (name) {
      query.$text = { $search: name };
    }
    if (Array.isArray(learningObjectIds)) {
      query.$or = query.$or || [];
      query.$or.push({ _id: { $in: learningObjectIds } });
    }
    if (authors) {
      query.$or = query.$or || [];
      query.$or.push(
        <any>{
          authorID: { $in: authors.map(author => author._id) },
        },
        {
          contributors: { $in: authors.map(author => author.username) },
        },
      );
    }

    if (length) {
      query.length = { $in: length };
    }
    if (level) {
      query.levels = { $in: level };
    }
    if (status) {
      query.status = { $in: status };
    }
    if (collection) {
      query.collection = { $in: collection };
    }

    return query;
  }

  /**
   * Builds Learning Object Query based on Text
   *
   * @private
   * @param {*} query
   * @param {string} text
   * @param {{ _id: string; username: string }[]} authors
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} learningObjectIds
   * @returns
   * @memberof MongoDriver
   */
  private buildTextSearchQuery({
    query,
    text,
    authors,
    status,
    length,
    level,
    learningObjectIds,
    collection,
  }: {
    query: any;
    text: string;
    authors?: { _id: string; username: string }[];
    status?: string[];
    length?: string[];
    level?: string[];
    learningObjectIds?: string[];
    collection?: string[];
  }) {
    const regex = new RegExp(sanitizeRegex(text));
    query.$or = [
      { $text: { $search: text } },
      { name: regex },
      { contributors: regex },
    ];
    if (Array.isArray(learningObjectIds)) {
      query.$or.push({ _id: { $in: learningObjectIds } });
    }
    if (authors && authors.length) {
      query.$or.push(
        <any>{
          authorID: { $in: authors.map(author => author._id) },
        },
        {
          contributors: { $in: authors.map(author => author._id) },
        },
      );
    }
    if (length) {
      query.length = { $in: length };
    }
    if (level) {
      query.levels = { $in: level };
    }
    if (status) {
      query.status = { $in: status };
    }
    if (collection) {
      query.collection = { $in: collection };
    }
    return query;
  }

  private applyCursorFilters<T>(
    cursor: Cursor<T>,
    filters: Filters,
  ): Cursor<T> {
    let { page, limit, orderBy, sortType } = filters;
    page = this.formatPage(filters.page);
    const skip = this.calcSkip({ page, limit });

    // Paginate
    if (skip != null && limit) {
      cursor = cursor.skip(skip).limit(limit);
    } else if (skip == null && limit) {
      cursor = cursor.limit(limit);
    }

    // Apply orderBy
    if (orderBy) {
      cursor = cursor.sort(orderBy, sortType ? sortType : 1);
    }
    return cursor;
  }

  /**
   * Ensures page is not less than 1 if defined
   *
   * @private
   * @param {number} page
   * @returns
   * @memberof MongoDriver
   */
  private formatPage(page: number) {
    if (page != null && page <= 0) {
      return 1;
    }
    return page;
  }

  /**
   * Calculated number of docs to skip based on page and limit
   *
   * @private
   * @param {{ page: number; limit: number }} params
   * @returns
   * @memberof MongoDriver
   */
  private calcSkip(params: { page: number; limit: number }) {
    return params.page && params.limit ? (params.page - 1) * params.limit : 0;
  }

  /**
   * Gets Learning Objects IDs that have outcomes mapped to specific guidelines
   * *** Note  to prevent matching when params are undefined, `null` is returned instead of an empty array ***
   *
   * @private
   * @param {string[]} guidelineIds [Ids of the guidelines]
   * @param {string[]} guidelineSources [Source names of the guidelines]
   * @returns {Promise<string[]>}
   * @memberof MongoDriver
   */
  private async matchLearningObjectsByGuidelines({
    guidelineIds,
    guidelineSources,
  }: {
    guidelineIds?: string[];
    guidelineSources?: string[];
  }): Promise<string[]> {
    if (guidelineSources) {
      return this.matchLearningObjectsByGuidelineSource({
        guidelineIds,
        guidelineSources,
      });
    } else if (guidelineIds) {
      const docs = await this.db
        .collection(COLLECTIONS.LEARNING_OUTCOMES)
        .find<LearningOutcomeDocument>(
          {
            mappings: { $all: guidelineIds },
          },
          { projection: { _id: 0, source: 1 } },
        )
        .toArray();
      return docs.map(doc => doc.source);
    }
    return null;
  }

  /**
   * Retrieves ids for Learning Objects that have outcomes mapped to specified source or specified source and guideline ids
   *
   * @private
   * @param {string[]} guidelineIds [List of guideline/mappings ids to be matched]
   * @param {string[]} guidelineSources [List of guideline/mappings sources to be matched]
   * @returns {Promise<string[]>}
   * @memberof MongoDriver
   */
  private async matchLearningObjectsByGuidelineSource({
    guidelineIds,
    guidelineSources,
  }: {
    guidelineIds: string[];
    guidelineSources: string[];
  }): Promise<string[]> {
    const learningOutcomeMatcher: {
      $match: {
        $expr: {
          [index: string]: any;
        };
        mappings?: {
          $all: string[];
        };
      };
    } = {
      $match: { $expr: { $eq: ['$$guideline_id', '$mappings'] } },
    };
    if (Array.isArray(guidelineIds)) {
      learningOutcomeMatcher.$match.mappings = { $all: guidelineIds };
    }
    const results = await this.db
      .collection(COLLECTIONS.STANDARD_OUTCOMES)
      .aggregate<{ learningObjectIds: string[] }>([
        { $match: { source: { $in: guidelineSources } } },
        {
          $lookup: {
            from: COLLECTIONS.LEARNING_OUTCOMES,
            let: { guideline_id: '$_id' },
            pipeline: [
              { $unwind: '$mappings' },
              learningOutcomeMatcher,
              { $project: { _id: 0, source: 1 } },
            ],
            as: 'outcomes',
          },
        },
        { $unwind: '$outcomes' },
        {
          $group: {
            _id: 1,
            learningObjectIds: { $addToSet: '$outcomes.source' },
          },
        },
      ])
      .toArray();
    if (results[0]) {
      return results[0].learningObjectIds;
    }
    return [];
  }

  /**
   * Search for users that match author or text param
   *
   * @private
   * @param {string} author
   * @param {string} text
   * @returns {Promise<UserDocument[]>}
   * @memberof MongoDriver
   */
  private async matchUsers(
    author: string,
    text: string,
  ): Promise<{ _id: string; username: string }[]> {
    const query = {
      $or: [{ $text: { $search: author ? author : text } }],
    };
    if (text) {
      const regex = new RegExp(sanitizeRegex(text), 'ig');
      (<any[]>query.$or).push(
        { username: regex },
        { name: regex },
        { email: regex },
      );
    }
    return author || text
      ? await this.db
          .collection(COLLECTIONS.USERS)
          .find<{ _id: string; username: string }>(query)
          .project({
            _id: 1,
            username: 1,
            score: { $meta: 'textScore' },
          })
          .sort({ score: { $meta: 'textScore' } })
          .toArray()
      : null;
  }
  /**
   * Fetches all Learning Object collections and displays only the name, abreviated name and logo.
   *
   * @returns {Promise<LearningObjectCollection[]>}
   * @memberof MongoDriver
   */
  async fetchCollections(): Promise<LearningObjectCollection[]> {
    try {
      const collections = await this.db
        .collection(COLLECTIONS.LO_COLLECTIONS)
        .aggregate([
          {
            $project: {
              _id: 0,
              name: 1,
              abvName: 1,
              hasLogo: 1,
            },
          },
        ])
        .toArray();
      return collections;
    } catch (e) {
      console.error(e);
      return Promise.reject(e);
    }
  }
  /**
   * Fetches Learning Object Collection by name
   *
   * @param {string} name
   * @returns {Promise<LearningObjectCollection>}
   * @memberof MongoDriver
   */
  async fetchCollection(name: string): Promise<LearningObjectCollection> {
    try {
      const collection = await this.db
        .collection(COLLECTIONS.LO_COLLECTIONS)
        .findOne({ name: name });
      const objects = await Promise.all(
        collection.learningObjects.map((id: string) => {
          return this.fetchLearningObject({ id, full: false });
        }),
      );

      collection.learningObjects = objects;
      return collection;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async fetchCollectionMeta(
    abvName: string,
  ): Promise<{ name: string; abstracts?: any[] }> {
    try {
      const meta: any = await this.db
        .collection(COLLECTIONS.LO_COLLECTIONS)
        .findOne({ $or: [{ name: abvName }, { abvName }] }, <any>{
          name: 1,
          abstracts: 1,
        });
      if (!meta) {
        throw new ResourceError(
          'Collection Not Found',
          ResourceErrorReason.NOT_FOUND,
        );
      }
      return meta;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async addToCollection(
    learningObjectId: string,
    collection: string,
  ): Promise<void> {
    try {
      // access learning object and update it's collection property
      await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOneAndUpdate({ _id: learningObjectId }, { $set: { collection } });
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async createChangelog(params: {
    learningObjectId: string;
    author: {
      userId: string;
      name: string;
      role: string;
      profileImage: string;
    };
    changelogText: string;
  }): Promise<void> {
    return this.changelogStore.createChangelog({
      learningObjectId: params.learningObjectId,
      author: params.author,
      changelogText: params.changelogText,
    });
  }

  ////////////////////////////////////////////////
  // GENERIC HELPER METHODS - not in public API //
  ////////////////////////////////////////////////
  /**
   * Converts Learning Object to Document
   *
   * @private
   * @param {LearningObject} object
   * @param {boolean} [isNew]
   * @param {string} [id]
   * @returns {Promise<LearningObjectDocument>}
   * @memberof MongoDriver
   */
  private async documentLearningObject(
    object: LearningObject,
  ): Promise<LearningObjectDocument> {
    const authorID = await this.findUser(object.author.username);
    let contributorIds: string[] = [];

    if (object.contributors && object.contributors.length) {
      contributorIds = await Promise.all(
        object.contributors.map(user => this.findUser(user.username)),
      );
    }

    const doc: LearningObjectDocument = {
      _id: object.id || new ObjectID().toHexString(),
      cuid: object.cuid,
      authorID: authorID,
      name: object.name,
      date: object.date,
      length: object.length,
      levels: object.levels,
      description: object.description,
      materials: object.materials,
      contributors: contributorIds,
      collection: object.collection,
      status: object.status,
      children: object.children.map(obj => obj.id),
      revision: object.revision,
    };

    return doc;
  }

  /**
   * Converts Released Learning Object to Document
   *
   * @private
   * @param {LearningObject} object
   * @param {boolean} [isNew]
   * @param {string} [id]
   * @returns {Promise<LearningObjectDocument>}
   * @memberof MongoDriver
   */
  private async documentReleasedLearningObject(
    object: LearningObject,
  ): Promise<LearningObjectDocument> {
    let contributorIds: string[] = [];

    if (object.contributors && object.contributors.length) {
      contributorIds = await Promise.all(
        object.contributors.map(user => this.findUser(user.username)),
      );
    }

    const doc: ReleasedLearningObjectDocument = {
      _id: object.id,
      cuid: object.cuid,
      authorID: object.author.id,
      name: object.name,
      date: object.date,
      length: object.length,
      levels: object.levels,
      description: object.description,
      materials: object.materials,
      contributors: contributorIds,
      collection: object.collection,
      outcomes: object.outcomes.map(this.documentOutcome),
      status: object.status,
      children: object.children.map(obj => obj.id),
      revision: object.revision,
    };

    return doc;
  }

  /**
   * Converts Learning Outcome into OutcomeDocument
   *
   * @private
   * @param {LearningOutcome} outcome [Learning Outcome to convert to OutcomeDocument]
   * @returns {OutcomeDocument}
   * @memberof MongoDriver
   */
  private documentOutcome(outcome: LearningOutcome): OutcomeDocument {
    return {
      id: outcome.id,
      outcome: outcome.outcome,
      bloom: outcome.bloom,
      verb: outcome.verb,
      text: outcome.text,
      mappings: outcome.mappings.map(guideline => guideline.id),
    };
  }

  /**
   * Converts LearningObjectDocument to LearningObjectSummary
   *
   * @private
   * @param {LearningObjectDocument} record [Learning Object data]
   * @returns {Promise<LearningObjectSummary>}
   * @memberof MongoDriver
   */
  private async generateLearningObjectSummary(
    record: LearningObjectDocument,
  ): Promise<LearningObjectSummary> {
    const author$ = this.fetchUser(record.authorID);
    const contributors$ = Promise.all(
      record.contributors.map(id => this.fetchUser(id)),
    );
    const [author, contributors] = await Promise.all([author$, contributors$]);

    let children: LearningObjectChildSummary[] = [];
    if (record.children) {
      children = (await this.loadChildObjects({
        id: record._id,
        full: false,
        status: [],
      })).map(mapChildLearningObjectToSummary);
    }

    return mapLearningObjectToSummary({
      ...(record as any),
      author,
      contributors,
      children,
      id: record._id,
    });
  }

  /**
   * Converts LearningObjectDocument to LearningObjectSummary
   *
   * @private
   * @param {LearningObjectDocument} record [Learning Object data]
   * @returns {Promise<LearningObjectSummary>}
   * @memberof MongoDriver
   */
  private async generateReleasedLearningObjectSummary(
    record: LearningObjectDocument,
  ): Promise<LearningObjectSummary> {
    const author$ = this.fetchUser(record.authorID);
    const contributors$ = Promise.all(
      record.contributors.map(id => this.fetchUser(id)),
    );
    const [author, contributors] = await Promise.all([author$, contributors$]);
    let hasRevision = record.hasRevision;
    if (hasRevision == null) {
      hasRevision = await this.learningObjectHasRevision(record._id);
    }
    let children: LearningObjectChildSummary[] = [];
    if (record.children) {
      children = (await this.loadReleasedChildObjects({
        id: record._id,
        full: false,
      })).map(mapChildLearningObjectToSummary);
    }

    return mapLearningObjectToSummary({
      ...(record as any),
      author,
      contributors,
      children,
      hasRevision,
      id: record._id,
    });
  }

  /**
   * Generates Learning Object from Document
   *
   * @private
   * @param {User} author
   * @param {LearningObjectDocument} record
   * @param {boolean} [full]
   * @returns {Promise<LearningObject>}
   * @memberof MongoDriver
   */
  private async generateLearningObject(
    author: User,
    record: LearningObjectDocument,
    full?: boolean,
  ): Promise<LearningObject> {
    // Logic for loading any learning object
    let learningObject: LearningObject;
    let materials: LearningObject.Material;
    let contributors: User[] = [];
    let outcomes: LearningOutcome[] = [];
    let children: LearningObject[] = [];
    // Load Contributors
    if (record.contributors && record.contributors.length) {
      contributors = await Promise.all(
        record.contributors.map(userId => this.fetchUser(userId)),
      );
    }
    // If full object requested, load up non-summary properties
    if (full) {
      // Logic for loading 'full' learning objects
      materials = <LearningObject.Material>record.materials;
      outcomes = await this.getAllLearningOutcomes({
        source: record._id,
      });
    }
    learningObject = new LearningObject({
      id: record._id,
      cuid: record.cuid,
      author,
      name: record.name,
      date: record.date,
      length: record.length as LearningObject.Length,
      levels: record.levels as LearningObject.Level[],
      collection: record.collection,
      status: record.status as LearningObject.Status,
      description: record.description,
      materials,
      contributors,
      outcomes,
      hasRevision: record.hasRevision,
      children,
      revision: record.revision,
    });

    return learningObject;
  }

  /**
   * Generates released Learning Object from Document
   *
   * @private
   * @param {User} author
   * @param {ReleasedLearningObjectDocument} record
   * @param {boolean} [full]
   * @returns {Promise<LearningObject>}
   * @memberof MongoDriver
   */
  private async generateReleasedLearningObject(
    author: User,
    record: ReleasedLearningObjectDocument,
    full?: boolean,
  ): Promise<LearningObject> {
    // Logic for loading any learning object
    let learningObject: LearningObject;
    let materials: LearningObject.Material;
    let contributors: User[] = [];
    let children: LearningObject[] = [];
    let outcomes: LearningOutcome[] = [];
    // Load Contributors
    if (record.contributors && record.contributors.length) {
      contributors = await Promise.all(
        record.contributors.map(userId => this.fetchUser(userId)),
      );
    }
    // If full object requested, load up non-summary properties
    if (full) {
      // Logic for loading 'full' learning objects
      materials = <LearningObject.Material>record.materials;
      for (let i = 0; i < record.outcomes.length; i++) {
        const mappings = await this.learningOutcomeStore.getAllStandardOutcomes(
          {
            ids: record.outcomes[i].mappings,
          },
        );
        outcomes.push(
          new LearningOutcome({
            ...record.outcomes[i],
            mappings: mappings,
            id: record.outcomes[i]['_id'],
          }),
        );
      }
    }
    learningObject = new LearningObject({
      id: record._id,
      cuid: record.cuid,
      author,
      name: record.name,
      date: record.date,
      length: record.length as LearningObject.Length,
      levels: record.levels as LearningObject.Level[],
      collection: record.collection,
      status: record.status as LearningObject.Status,
      description: record.description,
      materials,
      contributors,
      outcomes: outcomes,
      hasRevision: record.hasRevision,
      children,
      revision: record.revision,
    });
    return learningObject;
  }
}

export function isEmail(value: string): boolean {
  const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (emailPattern.test(value)) {
    return true;
  }
  return false;
}

/**
 * Escapes Regex quantifier, alternation, single sequence anchor, new line, and parenthesis characters in a string
 *
 * @export
 * @param {string} text
 * @returns {string}
 */
export function sanitizeRegex(text: string): string {
  const regexChars = /\.|\+|\*|\^|\$|\?|\[|\]|\(|\)|\|/;
  if (regexChars.test(text)) {
    let newString = '';
    const chars = text.split('');
    for (const c of chars) {
      const isSpecial = regexChars.test(c.trim());
      if (isSpecial) {
        newString += `\\${c}`;
      } else {
        newString += c;
      }
    }
    text = newString;
  }
  return text;
}
