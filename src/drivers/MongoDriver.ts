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
  LearningObjectUpdates,
  LearningObjectDocument,
  UserDocument,
  LearningOutcomeDocument,
  StandardOutcomeDocument,
  LearningObjectSummary,
} from '../shared/types';
import { LearningOutcomeMongoDatastore } from '../LearningOutcomes/LearningOutcomeMongoDatastore';
import {
  LearningOutcomeInput,
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from '../LearningOutcomes/types';
import { LearningObjectStatStore } from '../LearningObjectStats/LearningObjectStatStore';
import { LearningObjectStats } from '../LearningObjectStats/LearningObjectStatsInteractor';
import { lengths } from '@cyber4all/clark-taxonomy';
import { LearningObjectDataStore } from '../LearningObjects/drivers/LearningObjectDatastore';
import { ChangeLogDocument } from '../shared/types/changelog';
import { ChangelogDataStore } from '../Changelogs/ChangelogDatastore';
import {
  ResourceError,
  ResourceErrorReason,
  ServiceError,
  ServiceErrorReason,
} from '../shared/errors';
import { reportError } from '../shared/SentryConnector';
import { LearningObject, LearningOutcome, User, StandardOutcome } from '../shared/entity';
import { Submission } from '../LearningObjectSubmission/types/Submission';
import { MongoConnector } from '../shared/Mongo/MongoConnector';
import { mapLearningObjectToSummary } from '../shared/functions';
import {
  ReleasedLearningObjectDocument,
  OutcomeDocument,
} from '../shared/types/learning-object-document';

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
  changelogStore: ChangelogDataStore;

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
    this.changelogStore = new ChangelogDataStore(this.db);
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
   *
   * @returns {Promise<LearningObjectSummary>}
   * @memberof MongoDriver
   */
  async fetchLearningObjectRevisionSummary({
    id,
    revision,
  }: {
    id: string;
    revision: number;
  }): Promise<LearningObjectSummary> {
    const doc =
      (await this.db
        .collection(COLLECTIONS.RELEASED_LEARNING_OBJECTS)
        .findOne({ _id: id, revision })) ||
      (await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOne({ _id: id, revision }));
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
      guidelines,
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
    const outcomeIDs: string[] = await this.matchOutcomesByGuidelines({
      guidelineIds: standardOutcomeIDs,
      guidelineSources: guidelines,
    });

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
   * Constructs aggregation pipeline for searching all objects with pagination and sorting By matching learning obejcts based on
   * queries provided, then joining the working and released collection together, adding the hasRevision flag to released learning object based on
   * the status of the working object, removing duplicates then returns a filtered and sorted superset of working and released learning objects.
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

    // create a large filtered collection of learning objects with diplicates.
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
        // match based on id's and status array if given.
        matchQuery,
        {
          // grab the children of learning objects
          $graphLookup: {
            from: collection || COLLECTIONS.LEARNING_OBJECTS,
            startWith: '$children',
            connectFromField: 'children',
            connectToField: '_id',
            as: 'objects',
            maxDepth: 0,
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
  }): Promise<LearningObject[]> {
    return this.loadChildObjects({
      ...params,
      collection: COLLECTIONS.RELEASED_LEARNING_OBJECTS,
      status: [LearningObject.Status.RELEASED],
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
  async fetchLearningObject(params: {
    id: string;
    full?: boolean;
  }): Promise<LearningObject> {
    const results = await this.db
      .collection<LearningObjectDocument & { orderedFiles: any[] }>(
        COLLECTIONS.LEARNING_OBJECTS,
      )
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
          },
        },
      ])
      .toArray();
    if (results && results[0]) {
      const object = results[0];
      object.materials.files = object.orderedFiles;
      delete object.orderedFiles;
      const author = await this.fetchUser(object.authorID);
      return this.generateLearningObject(author, object, params.full);
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
        if (!query.$or) {
          query.$or = [];
        }
        query.$or.push({ description: { $regex: params.text, $options: 'i' } }, { name: { $regex: params.text, $options: 'i'} });
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
      const outcomeIDs: string[] = await this.matchOutcomesByGuidelines({
        guidelineIds: standardOutcomeIDs,
        guidelineSources: guidelines,
      });

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

  /**
   * Builds query object for Learning Object search
   *
   * @private
   * @param {string} text
   * @param {string[]} authorIDs
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} guidelines
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
    guidelines?: string[];
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
    guidelines?: string[];
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
      guidelines,
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
   * Gets Learning Outcome IDs that are mapped to specific Guidelines
   * *** Note  to prevent matching when params are undefined, `null` is returned instead of an empty array ***
   *
   * @private
   * @param {string[]} guidelineIds
   * @returns {Promise<LearningOutcomeDocument[]>}
   * @memberof MongoDriver
   */
  private async matchOutcomesByGuidelines({
    guidelineIds,
    guidelineSources,
  }: {
    guidelineIds?: string[];
    guidelineSources?: string[];
  }): Promise<string[]> {
    if (guidelineSources) {
      return this.matchOutcomesByGuidelineSource({
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
          { projection: { _id: 1 } },
        )
        .toArray();
      return docs.map(doc => doc._id);
    }
    return null;
  }

  /**
   * Retrieves ids for Learning Outcomes that match specified source or specified source and mapping ids
   *
   * @private
   * @param {string[]} guidelineIds [List of guideline/mappings ids to be matched]
   * @param {string[]} guidelineSources [List of guideline/mappings sources to be matched]
   * @returns {Promise<string[]>}
   * @memberof MongoDriver
   */
  private async matchOutcomesByGuidelineSource({
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
      .aggregate<{ outcomeIds: string[] }>([
        { $match: { source: { $in: guidelineSources } } },
        {
          $lookup: {
            from: COLLECTIONS.LEARNING_OUTCOMES,
            let: { guideline_id: '$_id' },
            pipeline: [
              { $unwind: '$mappings' },
              learningOutcomeMatcher,
              { $project: { _id: 1 } },
            ],
            as: 'outcomes',
          },
        },
        { $unwind: '$outcomes' },
        {
          $group: {
            _id: 1,
            outcomeIds: { $addToSet: '$outcomes._id' },
          },
        },
      ])
      .toArray();
    if (results[0]) {
      return results[0].outcomeIds;
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
    return mapLearningObjectToSummary({
      ...(record as any),
      author,
      contributors,
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
        const mappings = await this.learningOutcomeStore.getAllStandardOutcomes({
          ids: record.outcomes[i].mappings,
        });
        outcomes.push(new LearningOutcome({...record.outcomes[i], mappings: mappings, id: record.outcomes[i]['_id']}));
      }
    }
    learningObject = new LearningObject({
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
