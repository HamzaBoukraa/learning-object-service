import { Cursor, Db, MongoClient } from 'mongodb';
import { DataStore } from '../shared/interfaces/interfaces';
import {
  Filters,
  LearningObjectCollection,
  ParentLearningObjectQuery,
} from '../shared/interfaces/DataStore';
import {
  LearningObjectMetadataUpdates,
  LearningObjectDocument,
  StandardOutcomeDocument,
  LearningObjectSummary,
} from '../shared/types';
import { UserServiceGateway } from '../shared/gateways/user-service/UserServiceGateway';
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
import { MongoConnector } from '../shared/MongoDB/MongoConnector';
import { LearningObjectUpdates } from '../shared/types/learning-object-updates';
import * as mongoHelperFunctions from '../shared/MongoDB/HelperFunctions';
import { sanitizeRegex, mapLearningObjectToSummary } from '../shared/functions';

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
   * @param {string} id [Id of the Learning Object to fetch materials of]
   * @returns {Promise<LearningObject.Material>}
   * @memberof MongoDriver
   */
  async fetchReleasedMaterials(id: string): Promise<LearningObject.Material> {
    const doc = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
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
      return mongoHelperFunctions.generateLearningObjectSummary(doc);
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
    const doc = await mongoHelperFunctions.documentReleasedLearningObject(
      object,
    );
    await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .replaceOne({ _id: object.id }, doc, { upsert: true });
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
    full?: boolean;
  }): Promise<LearningObjectSummary[]> {
    // TODO: add type for resued learning object queries.
    const findChildren = {
      $graphLookup: {
        from: COLLECTIONS.LEARNING_OBJECTS,
        startWith: '$children',
        connectFromField: 'children',
        connectToField: '_id',
        as: 'objects',
        maxDepth: 0,
        restrictSearchWithMatch: { status: LearningObject.Status.RELEASED },
      },
    };
    const docs = await this.db
      .collection<{ objects: LearningObjectDocument[] }>(
        COLLECTIONS.LEARNING_OBJECTS,
      )
      .aggregate([
        {
          $match: { _id: id, status: { $ne: LearningObject.Status.RELEASED } },
        },
        findChildren,
        // only return children.
        { $project: { _id: 0, objects: '$objects' } },
      ])
      .toArray();
    if (docs[0]) {
      const objects = docs[0].objects;
      return mongoHelperFunctions.bulkGenerateLearningObjects(objects, full);
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
      const doc = await mongoHelperFunctions.documentLearningObject(object);
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
      .find(matchQuery)
      .toArray();

    return mongoHelperFunctions.bulkGenerateLearningObjects(parents);
  }

  async loadChildObjects(params: {
    id: string;
    full?: boolean;
    status: string[];
    collection?: string;
  }): Promise<LearningObject[]> {
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
      return mongoHelperFunctions.bulkGenerateLearningObjects(objects, full);
    }
    return [];
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
    return await mongoHelperFunctions.bulkGenerateLearningObjects(
      parentDocs,
      full,
    );
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
   * Look up a learning object by its author and cuid.
   * By default it will perform this query on the objects collection.
   * If collection param is passed then it will perform the query on specified collection
   *
   * @param {{
   *     authorId: string; [Id of the author]
   *     cuid: string; [cuid of the learning object]
   *     version?: number; [version of the learning object]
   *     status?: string; [status of the learning object]
   *   }} params
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async findLearningObject(params: {
    authorId: string;
    cuid: string;
    version?: number;
    status?: string;
  }): Promise<string> {
    const { authorId, cuid, version, status } = params;
    const query: { [x: string]: any } = {
      authorID: authorId,
      cuid,
    };
    if (status) {
      query.status = status;
    }
    if (version) {
      query.version = version;
    }
    const doc = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne<LearningObjectDocument>(query, { projection: { _id: 1 } });
    if (doc) {
      return doc._id;
    }
    return null;
  }

  /**
   * Look up a learning object by its author and name.
   * 
   * @param {{
   *   authorId: string; [id of the author]
   *   cuid: string; [cuid of the learning object]
   *   version?: number; [version of the learning object]
   * }} params
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async findLearningObjectByName(params: {
    authorId: String;
    name: string;
    version?: number;
  }): Promise<string> {
    const { authorId, name, version } = params;
    const query: { [x: string]: any } = {
      authorID: authorId,
      name,
    };
    if (version) {
      query.version = version;
    }
    const doc = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .findOne<LearningObjectDocument>(query, { projection: { _id: 1 } });
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
   *     cuid: string; [cuid of the Learning Object]
   *   }} params
   * @returns {Promise<string>}
   * @memberof MongoDriver
   */
  async findReleasedLearningObject(params: {
    authorId: string;
    cuid: string;
  }): Promise<string> {
    return this.findLearningObject({
      ...params,
      status: LearningObject.Status.RELEASED,
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
   * Fetch the learning object document associated with the given id.
   * FIXME:clean this query up after files collection is created
   *
   *
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
      const author = await UserServiceGateway.getInstance().queryUserById(
        doc.authorID,
      );
      return mongoHelperFunctions.generateLearningObject(author, doc, full);
    }
    return null;
  }

  /**
   * Fetch a all version of a Learning Object by CUID, or a single version of the Learning Object with the optional version parameter
   *
   * @param {string} cuid the CLARK universal identifier of the Learning Object
   * @param {number} [version] a number representing the desired version of the Learning Object
   * @returns {Promise<LearningObjectSummary[]>}
   * @memberof MongoDriver
   */
  async fetchLearningObjectByCuid(cuid: string, version?: number): Promise<LearningObjectSummary[]> {
    const query: { cuid: string, revision?: number } = { cuid, revision: version };

    let notFoundError = `No Learning Object found for CUID '${cuid}'`;

    if (version !== undefined) {
      query.revision = version;
      notFoundError += ` with version ${version}`;
    }

    const objects: LearningObjectDocument[] = await this.db.collection('objects').find(query).toArray();

    if (!objects || !objects.length) {
      throw new ResourceError(notFoundError, ResourceErrorReason.NOT_FOUND);
    }

    const author = await UserServiceGateway.getInstance().queryUserById(objects[0].authorID);

    return Promise.all(objects.map(async o => mapLearningObjectToSummary(await mongoHelperFunctions.generateLearningObject(author, o))));
  }

  /**
   * Fetches released object through aggregation pipeline by performing a match based on the object id, finding the duplicate object in the
   * working collection, then checking the status of the duplicate to determine whether or not to set hasRevision to true or false.
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
    // TODO: create a query to pull learning object files from file db
    const results = await this.db
      .collection(COLLECTIONS.LEARNING_OBJECTS)
      .aggregate([
        {
          // match learning object by params.id and released status's initially
          $match: {
            _id: params.id,
            status: { $eq: LearningObject.Status.RELEASED },
          },
        },
        // perform a lookup and store the working copy of the object under the "workingCopy" array.
        {
          $graphLookup: {
            from: 'objects',
            startWith: '$cuid',
            connectFromField: 'cuid',
            connectToField: 'cuid',
            as: 'workingCopy',
          },
        },
        // unwind copy from array to object so we can check certain fields.
        { $unwind: { path: '$workingCopy', preserveNullAndEmptyArrays: true } },
        // if the copys' status differs from the released objects status, then the object has a revision.
        // so we add a the field 'hasRevision' with a true value
        {
          $addFields: {
            hasRevision: {
              $cond: [{ $ne: ['$copy.status', 'released'] }, true, false],
            },
          },
        },
        { $project: { workingCopy: 0 } },
      ])
      .toArray();
    if (results && results[0]) {
      const object = results[0];
      object.materials.files = object.orderedFiles;
      delete object.orderedFiles;
      const author = await UserServiceGateway.getInstance().queryUserById(
        object.authorID,
      );
      return mongoHelperFunctions.generateReleasedLearningObject(
        author,
        object,
        params.full,
      );
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

      const learningObjects: LearningObject[] = await mongoHelperFunctions.bulkGenerateLearningObjects(
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

  private applyCursorFilters<T>(
    cursor: Cursor<T>,
    filters: Filters,
  ): Cursor<T> {
    let { page, limit, orderBy, sortType } = filters;
    page = mongoHelperFunctions.validatePageNumber(filters.page);
    const skip = mongoHelperFunctions.calculateDocumentsToSkip({ page, limit });

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
}
