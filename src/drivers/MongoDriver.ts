import { Cursor, Db, MongoClient, ObjectID } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import {
  Filters,
  LearningObjectCollection,
  ReleasedLearningObjectQuery,
  QueryCondition,
  LearningObjectQuery,
  ParentLearningObjectQuery,
} from '../interfaces/DataStore';
import {
  CompletedPart,
  MultipartFileUploadStatus,
} from '../interfaces/FileManager';
import * as ObjectMapper from './Mongo/ObjectMapper';
import { SubmissionDatastore } from '../LearningObjectSubmission/SubmissionDatastore';
import {
  LearningObjectUpdates,
  LearningObjectDocument,
  UserDocument,
  LearningOutcomeDocument,
  StandardOutcomeDocument,
} from '../types';
import { LearningOutcomeMongoDatastore } from '../LearningOutcomes/LearningOutcomeMongoDatastore';
import {
  LearningOutcomeInput,
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from '../LearningOutcomes/types';
import { LearningObjectStatStore } from '../LearningObjectStats/LearningObjectStatStore';
import { LearningObjectStats } from '../LearningObjectStats/LearningObjectStatsInteractor';
import { lengths } from '@cyber4all/clark-taxonomy';
import { LearningObjectDataStore } from '../LearningObjects/LearningObjectDatastore';
import { ChangeLogDocument } from '../types/changelog';
import { ChangelogDataStore } from '../Changelogs/ChangelogDatastore';
import {
  ResourceError,
  ResourceErrorReason,
  ServiceError,
  ServiceErrorReason,
} from '../errors';
import { reportError } from './SentryConnector';
import { LearningObject, LearningOutcome, User } from '../entity';

export enum COLLECTIONS {
  USERS = 'users',
  LEARNING_OBJECTS = 'objects',
  RELEASED_LEARNING_OBJECTS = 'released-objects',
  LEARNING_OUTCOMES = 'learning-outcomes',
  STANDARD_OUTCOMES = 'outcomes',
  LO_COLLECTIONS = 'collections',
  MULTIPART_STATUSES = 'multipart-upload-statuses',
  CHANGLOG = 'changelogs',
}

export class MongoDriver implements DataStore {
  submissionStore: SubmissionDatastore;
  learningOutcomeStore: LearningOutcomeMongoDatastore;
  statStore: LearningObjectStatStore;
  learningObjectStore: LearningObjectDataStore;
  changelogStore: ChangelogDataStore;

  private mongoClient: MongoClient;
  private db: Db;

  private constructor() {}

  static async build(dburi: string) {
    const driver = new MongoDriver();
    await driver.connect(dburi);
    await driver.initializeModules();
    return driver;
  }

  /**
   * Connect to the database. Must be called before any other functions.
   * @async
   *
   * NOTE: This function will attempt to connect to the database every
   *       time it is called, but since it assigns the result to a local
   *       variable which can only ever be created once, only one
   *       connection will ever be active at a time.
   *
   * TODO: Verify that connections are automatically closed
   *       when they no longer have a reference.
   *
   * @param {string} dbIP the host and port on which mongodb is running
   */
  async connect(dbURI: string, retryAttempt?: number): Promise<void> {
    try {
      this.mongoClient = await MongoClient.connect(dbURI);
      this.db = this.mongoClient.db();
    } catch (e) {
      if (!retryAttempt) {
        this.connect(dbURI, 1);
      } else {
        return Promise.reject(
          'Problem connecting to database at ' + dbURI + ':\n\t' + e,
        );
      }
    }
  }

  /**
   * Close the database. Note that this will affect all services
   * and scripts using the database, so only do this if it's very
   * important or if you are sure that *everything* is finished.
   */
  disconnect(): void {
    this.mongoClient.close();
  }

  /**
   * Initializes module stores
   *
   * @memberof MongoDriver
   */
  initializeModules() {
    this.submissionStore = new SubmissionDatastore(this.db);
    this.learningOutcomeStore = new LearningOutcomeMongoDatastore(this.db);
    this.statStore = new LearningObjectStatStore(this.db);
    this.learningObjectStore = new LearningObjectDataStore(this.db);
    this.changelogStore = new ChangelogDataStore(this.db);
  }

  /**
   * Fetches Learning Object's author's username
   *
   * @param {string} id
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async fetchLearningObjectAuthorUsername(id: string): Promise<string> {
    const results = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .aggregate([
        { $match: { _id: id } },
        {
          $lookup: {
            from: COLLECTIONS.USERS,
            localField: 'authorID',
            foreignField: '_id',
            as: 'author',
          },
        },
        { $unwind: { path: '$author' } },
        { $project: { 'author.username': 1 } },
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
    const doc = await this.documentLearningObject(object);
    await this.db
      .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .replaceOne({ _id: object.id }, doc, { upsert: true });
  }
  /**
   * Performs search on objects and released-objects collection based on query and or conditions
   *
   * @param {LearningObjectQuery} params
   * @returns {Promise<{
   *     total: number;
   *     objects: LearningObject[];
   *   }>}
   * @memberof MongoDriver
   */
  async searchAllObjects(
    params: LearningObjectQuery,
  ): Promise<{
    total: number;
    objects: LearningObject[];
  }> {
    const {
      name,
      author,
      collection,
      length,
      level,
      standardOutcomeIDs,
      text,
      conditions,
      orderBy,
      sortType,
      page,
      limit,
      status,
    } = params;

    const orConditions: any[] = conditions
      ? this.buildQueryConditions(conditions)
      : [];

    // Query for users
    const authors = await this.matchUsers(author, text);
    // Query by LearningOutcomes' mappings
    const outcomeIDs: string[] = await this.matchOutcomes(standardOutcomeIDs);

    const searchQuery = this.buildSearchQuery({
      name,
      authors,
      collection,
      length,
      level,
      text,
      outcomeIDs,
      status,
    });

    const pipeline = this.buildAllObjectsPipeline({
      searchQuery,
      orConditions,
      hasText: !!text,
      page,
      limit,
      orderBy,
      sortType,
    });

    const resultSet = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .aggregate<{
        objects: LearningObjectDocument[];
        total: [{ total: number }];
      }>(pipeline)
      .toArray();

    const results = resultSet[0];
    const objectDocs = results.objects;
    const objects: LearningObject[] = await this.bulkGenerateLearningObjects(
      objectDocs,
    );
    const total = results.total[0] ? results.total[0].total : 0;
    return { total, objects };
  }

  /**
   * Constructs aggregation pipeline for searching all objects
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
  private buildAllObjectsPipeline(params: {
    searchQuery?: any;
    orConditions?: any[];
    hasText?: boolean;
    page?: number;
    limit?: number;
    orderBy?: string;
    sortType?: 1 | -1;
  }): any[] {
    let {
      searchQuery,
      orConditions,
      hasText,
      page,
      limit,
      orderBy,
      sortType,
    } = params;

    let matcher: any = { ...searchQuery };
    if (orConditions && orConditions.length) {
      matcher.$and = [{ $or: orConditions }];
    }

    const match = { $match: { ...matcher } };

    const unWindArrayToRoot = [
      { $unwind: '$objects' },
      {
        $replaceRoot: { newRoot: '$objects' },
      },
    ];

    const joinCollections = {
      $lookup: {
        from: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
        let: { object_id: '$_id', object_status: '$status' },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ['$_id', '$$object_id'] }] },
            },
          },
          {
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
        as: 'released',
      },
    };

    const createSuperSet = [
      { $unwind: { path: '$released', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: 1,
          objects: { $push: '$$ROOT' },
          released: { $push: '$released' },
        },
      },
      {
        $project: {
          objects: { $concatArrays: ['$objects', '$released'] },
        },
      },
      ...unWindArrayToRoot,
    ];

    const removeDuplicates = [
      {
        $group: {
          _id: '$_id',
          objects: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          objects: {
            $cond: [
              { $eq: [{ $size: '$objects' }, 1] },
              { $arrayElemAt: ['$objects', 0] },
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
            ],
          },
        },
      },
      ...unWindArrayToRoot,
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
   * Submit a learning object to a specified collection
   * @param username the username of the requester
   * @param id the id of the learning object
   * @param collection the abreviated name of the collection to which to submit the object
   */
  submitLearningObjectToCollection(
    username: string,
    id: string,
    collection: string,
  ): Promise<void> {
    return this.submissionStore.submitLearningObjectToCollection(
      username,
      id,
      collection,
    );
  }

  /**
   * Unsubmit an object but keep it's collection property intact
   * @param id the id of the object to unsubmit
   */
  unsubmitLearningObject(id: string): Promise<void> {
    return this.submissionStore.unsubmitLearningObject(id);
  }

  /**
   * Performs update on multiple LearningObject documents
   *
   * @param {{
   *     ids: string[];
   *     updates: LearningObjectUpdates;
   *   }} params
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  async updateMultipleLearningObjects(params: {
    ids: string[];
    updates: LearningObjectUpdates;
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
   * Returns array of ids associated with the learning object's children objects
   * @param {{ parentId: string }} params 
   * @return {Promise<string[]>}
   * @memberof MongoDriver
   */
  async findChildObjectIds(params: { parentId: string }): Promise<string[]> {
    const children = await this.db
    .collection(COLLECTIONS.LEARNING_OBJECTS)
    .findOne<{ children: string [] }> (
      { _id: params.parentId },
      { projection: {children: 1} }
    )

    if (children) { 
      const childrenIDs = children.children;  
      return childrenIDs;
    }
    return [];
  }
  /**
   *  Fetches all child objects for object with given id
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
  }): Promise<LearningObject[]> {
    const { id, full, status, collection } = params;
    const matchQuery: { [index: string]: any } = {
      $match: { _id: id, status: { $in: status } },
    };

    const docs = await this.db
      .collection<{ objects: LearningObjectDocument[] }>(
        collection || COLLECTIONS.LEARNING_OBJECTS,
      )
      .aggregate([
        matchQuery,
        {
          $graphLookup: {
            from: collection || COLLECTIONS.LEARNING_OBJECTS,
            startWith: '$children',
            connectFromField: 'children',
            connectToField: '_id',
            as: 'objects',
            maxDepth: 0,
          },
        },
        { $project: { _id: 0, objects: '$objects' } },
      ])
      .toArray();
    if (docs[0]) {
      const objects = docs[0].objects;
      return this.bulkGenerateLearningObjects(objects, full);
    }
    return [];
  }

  /**
   * Loads released child objects
   *
   * @param {{
   *     id: string;
   *     full?: boolean;
   *     status: string[];
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async loadReleasedChildObjects(params: {
    id: string;
    full?: boolean;
    status: string[];
  }): Promise<LearningObject[]> {
    return this.loadChildObjects({
      ...params,
      collection: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
    });
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
    outcome: LearningOutcomeInput & LearningOutcomeInsert;
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

  async fetchRecentChangelog(
    learningObjectId: string,
  ): Promise<ChangeLogDocument> {
    return this.changelogStore.getRecentChangelog(learningObjectId);
  }

  async deleteChangelog(learningObjectId: string): Promise<void> {
    return this.changelogStore.deleteChangelog(learningObjectId);
  }

  /**
   * Updates or inserts LearningObjectFile into learning object's files array
   *
   * @param {{
   *     id: string;
   *     loFile: LearningObjectFile;
   *   }} params
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  public async addToFiles(params: {
    id: string;
    loFile: LearningObject.Material.File;
  }): Promise<void> {
    try {
      const existingDoc = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOneAndUpdate(
          { _id: params.id, 'materials.files.url': params.loFile.url },
          {
            $set: {
              'materials.files.$[element].date': params.loFile.date,
              'materials.files.$[element].size': params.loFile.size,
              'materials.files.$[element].packageable':
                params.loFile.packageable,
            },
          },
          // @ts-ignore: arrayFilters is in fact a property defined by documentation. Property does not exist in type definition.
          { arrayFilters: [{ 'element.url': params.loFile.url }] },
        );
      if (!existingDoc.value) {
        params.loFile.id = new ObjectID().toHexString();
        await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).updateOne(
          {
            _id: params.id,
          },
          { $push: { 'materials.files': params.loFile } },
        );
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async removeFromFiles(params: {
    objectId: string;
    fileId: string;
  }): Promise<void> {
    await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).updateOne(
      { _id: params.objectId },
      {
        $pull: {
          'materials.files': { id: params.fileId },
        },
      },
    );
  }

  /**
   * Inserts metadata for Multipart upload
   *
   * @param {{
   *     status: MultipartFileUploadStatus;
   *   }} params
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  public async insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void> {
    await this.db
      .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
      .insertOne(params.status);
  }

  /**
   * Fetches metadata for multipart upload
   *
   * @param {{
   *     id: string;
   *   }} params
   * @returns {Promise<MultipartFileUploadStatus>}
   * @memberof MongoDriver
   */
  public async fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus> {
    const status = await this.db
      .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
      .findOne({ _id: params.id });
    return status;
  }

  /**
   * Updates metadata for multipart upload
   *
   * @param {{
   *     id: string;
   *     completedPart: CompletedPart;
   *   }} params
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  public async updateMultipartUploadStatus(params: {
    id: string;
    completedPart: CompletedPart;
  }): Promise<void> {
    await this.db
      .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
      .updateOne(
        { _id: params.id },
        {
          $push: { completedParts: params.completedPart },
        },
      );
  }

  /**
   * Deletes metadata for multipart upload
   *
   * @param {{
   *     id: string;
   *   }} params
   * @returns {Promise<void>}
   * @memberof MongoDriver
   */
  public async deleteMultipartUploadStatus(params: {
    id: string;
  }): Promise<void> {
    await this.db
      .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
      .deleteOne({ _id: params.id });
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
   * Fetches Parents of requested Learning Object from working collection if collection not specified
   *
   * @param {{
   *     query: ParentLearningObjectQuery;
   *     collection: string [Collection to query for parent objects from]
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async fetchParentObjects(params: {
    query: ParentLearningObjectQuery;
    full?: boolean;
    collection?: COLLECTIONS.RELEASED_LEARNING_OBJECTS;
  }): Promise<LearningObject[]> {
    const { query, full } = params;
    const mongoQuery: { [index: string]: any } = { children: query.id };
    if (query.status) {
      mongoQuery.status = { $in: query.status };
    }
    let cursor: Cursor<LearningObjectDocument> = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .find<LearningObjectDocument>(mongoQuery);
    cursor = this.applyCursorFilters<LearningObjectDocument>(cursor, {
      ...(query as Filters),
    });
    const parentDocs = await cursor.toArray();
    const parents = await this.bulkGenerateLearningObjects(parentDocs, full);
    return parents;
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
    full?: boolean;
  }): Promise<LearningObject[]> {
    return this.fetchParentObjects({
      ...params,
      collection: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
    });
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
   * Get LearningObject IDs owned by User
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
          { $match: { username } },
          {
            $lookup: {
              from: COLLECTIONS.LEARNING_OBJECTS,
              localField: '_id',
              foreignField: 'authorID',
              as: 'objects',
            },
          },
          { $unwind: '$objects' },
          { $replaceRoot: { newRoot: '$objects' } },
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
   * @async
   *
   * @param id database id
   *
   * @returns {LearningObjectRecord}
   */
  async fetchLearningObject(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject> {
    const object = await this.db
      .collection<LearningObjectDocument>(COLLECTIONS.LEARNING_OBJECTS)
      .findOne({ _id: params.id });
    if (object) {
      const author = await this.fetchUser(object.authorID);
      return this.generateLearningObject(author, object, params.full);
    }

    return null;
  }

  /**
   * Fetches released object
   *
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
    const object = await this.db
      .collection<LearningObjectDocument>(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
      .findOne({ _id: params.id });
    if (object) {
      const author = await this.fetchUser(object.authorID);
      return this.generateLearningObject(author, object, params.full);
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
  async checkLearningObjectExistence(
    learningObjectId: string,
  ): Promise<string[]> {
    try {
      const arr = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .find({ _id: learningObjectId })
        .project({ _id: 1 })
        .toArray();
      return arr;
    } catch (e) {
      reportError(e);
      return Promise.reject(new ServiceError(ServiceErrorReason.INTERNAL));
    }
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
      const outcomeIDs: string[] = await this.matchOutcomes(standardOutcomeIDs);

      let query: any = this.buildSearchQuery({
        text,
        authors,
        length,
        level,
        outcomeIDs,
        name,
        collection,
      });

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

  async findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObject.Material.File> {
    try {
      const doc = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOne(
          {
            _id: params.learningObjectId,
            'materials.files': {
              $elemMatch: { id: params.fileId },
            },
          },
          {
            projection: {
              _id: 0,
              'materials.files.$': 1,
            },
          },
        );
      if (doc) {
        const materials = doc.materials;

        // Object contains materials property.
        // Files array within materials will alway contain one element
        return materials.files[0];
      }
    } catch (e) {
      return Promise.reject(e);
    }
  }

  async updateFileDescription(params: {
    learningObjectId: string;
    fileId: string;
    description: string;
  }): Promise<LearningObject.Material.File> {
    try {
      await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).findOneAndUpdate(
        { _id: params.learningObjectId, 'materials.files.id': params.fileId },
        {
          $set: {
            'materials.files.$[element].description': params.description,
          },
        },
        // @ts-ignore: arrayFilters is in fact a property defined by documentation. Property does not exist in type definition.
        { arrayFilters: [{ 'element.id': params.fileId }] },
      );
      return this.findSingleFile({
        learningObjectId: params.learningObjectId,
        fileId: params.fileId,
      });
    } catch (e) {
      return Promise.reject(e);
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
   * @param {string[]} outcomeIDs
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
    outcomeIDs?: string[];
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
  private buildFieldSearchQuery(params: {
    query: any;
    name?: string;
    authors?: { _id: string; username: string }[];
    status?: string[];
    length?: string[];
    level?: string[];
    outcomeIDs?: string[];
    collection?: string[];
  }) {
    const {
      query,
      name,
      authors,
      status,
      length,
      level,
      outcomeIDs,
      collection,
    } = params;
    if (name) {
      query.$text = { $search: name };
    }
    if (authors) {
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
    if (outcomeIDs) {
      query.outcomes = { $in: outcomeIDs };
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
   * @param {string[]} outcomeIDs
   * @returns
   * @memberof MongoDriver
   */
  private buildTextSearchQuery(params: {
    query: any;
    text: string;
    authors?: { _id: string; username: string }[];
    status?: string[];
    length?: string[];
    level?: string[];
    outcomeIDs?: string[];
    collection?: string[];
  }) {
    const {
      query,
      text,
      authors,
      status,
      length,
      level,
      outcomeIDs,
      collection,
    } = params;
    const regex = new RegExp(sanitizeRegex(text));
    query.$or = [
      { $text: { $search: text } },
      { name: { $regex: regex } },
      { contributors: { $regex: regex } },
    ];
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
    if (outcomeIDs) {
      query.outcomes = outcomeIDs.length
        ? { $in: outcomeIDs }
        : ['DONT MATCH ME'];
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
   * Gets Learning Outcome IDs that contain Standard Outcome IDs
   *
   * @private
   * @param {string[]} standardOutcomeIDs
   * @returns {Promise<LearningOutcomeDocument[]>}
   * @memberof MongoDriver
   */
  private async matchOutcomes(standardOutcomeIDs: string[]): Promise<string[]> {
    if (!standardOutcomeIDs) {
      return null;
    }
    const docs = await this.db
      .collection(COLLECTIONS.LEARNING_OUTCOMES)
      .find<LearningOutcomeDocument>(
        {
          mappings: { $all: standardOutcomeIDs },
        },
        { projection: { _id: 1 } },
      )
      .toArray();
    return docs.map(doc => doc._id);
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
        { username: { $regex: regex } },
        { name: { $regex: regex } },
        { email: { $regex: regex } },
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
   * Fetches all Learning Object collections
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
    name: string,
  ): Promise<{ name: string; abstracts?: any[] }> {
    try {
      const meta: any = await this.db
        .collection(COLLECTIONS.LO_COLLECTIONS)
        .findOne({ name }, <any>{ name: 1, abstracts: 1 });
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

  async createChangelog(
    learningObjectId: string,
    userId: string,
    changelogText: string,
  ): Promise<void> {
    return this.changelogStore.createChangelog(
      learningObjectId,
      userId,
      changelogText,
    );
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
    try {
      const authorID = await this.findUser(object.author.username);
      let contributorIds: string[] = [];

      if (object.contributors && object.contributors.length) {
        contributorIds = await Promise.all(
          object.contributors.map(user => this.findUser(user.username)),
        );
      }

      const doc: LearningObjectDocument = {
        _id: object.id || new ObjectID().toHexString(),
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
      };

      return doc;
    } catch (e) {
      return Promise.reject(
        `Problem creating document for Learning Object. Error:${e}`,
      );
    }
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
    let materials: LearningObject.Material;
    let contributors: User[] = [];
    let outcomes: LearningOutcome[] = [];
    let children: LearningObject[] =[]; 

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

      // load outcomes
      outcomes = await this.getAllLearningOutcomes({
        source: record._id,
      });
    }
    const learningObject = new LearningObject({
      id: record._id,
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
