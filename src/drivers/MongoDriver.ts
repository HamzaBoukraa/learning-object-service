import { MongoClient, Db, ObjectID, Cursor } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import {
  LearningObject,
  LearningOutcome,
  User,
  AcademicLevel,
} from '@cyber4all/clark-entity';
import {
  LearningObjectDocument,
  LearningOutcomeDocument,
  UserDocument,
  StandardOutcomeDocument,
} from '@cyber4all/clark-schema';
import {
  LearningObjectCollection,
  LearningObjectQuery,
  Filters,
} from '../interfaces/DataStore';
import {
  MultipartFileUploadStatus,
  MultipartFileUploadStatusUpdates,
  CompletedPart,
} from '../interfaces/FileManager';
import {
  LearningObjectLock,
  Restriction,
  Material,
} from '@cyber4all/clark-entity/dist/learning-object';
import { LearningObjectFile, LearningObjectInteractor } from '../interactors/LearningObjectInteractor';
import { reportError } from './SentryConnector';
import * as ObjectMapper from './Mongo/ObjectMapper';
import { SubmissionDatastore } from '../LearningObjectSubmission/SubmissionDatastore';
import { LearningObjectUpdates } from '../types';
import { LearningOutcomeMongoDatastore } from '../LearningOutcomes/LearningOutcomeMongoDatastore';
import {
  LearningOutcomeInput,
  LearningOutcomeInsert,
  LearningOutcomeUpdate,
} from '../LearningOutcomes/types';

export enum COLLECTIONS {
  USERS = 'users',
  LEARNING_OBJECTS = 'objects',
  LEARNING_OUTCOMES = 'learning-outcomes',
  STANDARD_OUTCOMES = 'outcomes',
  LO_COLLECTIONS = 'collections',
  MULTIPART_STATUSES = 'multipart-upload-statuses',
}

export class MongoDriver implements DataStore {
  submissionStore: SubmissionDatastore;
  learningOutcomeStore: LearningOutcomeMongoDatastore;
  togglePublished(
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    return this.submissionStore.togglePublished(username, id, published);
  }
  private mongoClient: MongoClient;
  private db: Db;

  constructor(dburi: string) {
    this.connect(dburi).then(() => {
      this.submissionStore = new SubmissionDatastore(this.db);
      this.learningOutcomeStore = new LearningOutcomeMongoDatastore(this.db);
    });
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
        this.connect(
          dbURI,
          1,
        );
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
      // FIXME: This should be scoped to Interactor
      const authorID = await this.findUser(object.author.username);
      const author = await this.fetchUser(authorID);
      if (!author.emailVerified) {
        object.unpublish();
      }

      // FIXME we should be setting an actual description property
      if (!object.goals || !object.goals.length) {
        object.goals = [{ text: '' }];
      }

      object.lock = {
        restrictions: [Restriction.DOWNLOAD],
      };
      const doc = await this.documentLearningObject(object, true);

      // insert object into the database
      await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).insertOne(doc);

      // add the object id to the user's objects array
      await this.db.collection(COLLECTIONS.USERS).findOneAndUpdate({ '_id': authorID }, { $push: { objects: doc._id } });
      return doc._id;
    } catch (e) {
      return Promise.reject(e);
    }
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
    loFile: LearningObjectFile;
  }): Promise<void> {
    try {
      const existingDoc = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOneAndUpdate(
          { _id: params.id, 'materials.files.url': params.loFile.url },
          { $set: { 'materials.files.$[element]': params.loFile } },
          // @ts-ignore: arrayFilters is in fact a property defined by documentation. Property does not exist in type definition.
          { arrayFilters: [{ 'element.url': params.loFile.url }] },
        );
      if (!existingDoc.value) {
        if (!params.loFile.id) {
          params.loFile.id = new ObjectID().toHexString();
        }
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
    console.log(params.fileId);
    await this.db.collection(COLLECTIONS.LEARNING_OBJECTS).updateOne(
      { _id: params.objectId },
      {
        $pull: {
          'materials.files': { id: params.fileId },
        },
      },
    );
  }

  public async insertMultipartUploadStatus(params: {
    status: MultipartFileUploadStatus;
  }): Promise<void> {
    try {
      await this.db
        .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
        .insertOne(params.status);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
  public async fetchMultipartUploadStatus(params: {
    id: string;
  }): Promise<MultipartFileUploadStatus> {
    try {
      const status = await this.db
        .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
        .findOne({ _id: params.id });
      return status;
    } catch (e) {
      return Promise.reject(e);
    }
  }
  public async updateMultipartUploadStatus(params: {
    id: string;
    updates: MultipartFileUploadStatusUpdates;
    completedPart: CompletedPart;
  }): Promise<void> {
    try {
      await this.db
        .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
        .updateOne(
          { _id: params.id },
          {
            $set: params.updates,
            $push: { completedParts: params.completedPart },
          },
        );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
  public async deleteMultipartUploadStatus(params: {
    id: string;
  }): Promise<void> {
    try {
      await this.db
        .collection<MultipartFileUploadStatus>(COLLECTIONS.MULTIPART_STATUSES)
        .deleteOne({ _id: params.id });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
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
    // FIXME: These lengths should be retrieved from a standardized source such as a npm module
    const lengths = ['nanomodule', 'micromodule', 'module', 'unit', 'course'];
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
   * Finds Parents of requested Object
   *
   * @param {{
   *     query: LearningObjectQuery;
   *   }} params
   * @returns {Promise<LearningObject[]>}
   * @memberof MongoDriver
   */
  async findParentObjects(params: {
    query: LearningObjectQuery;
  }): Promise<LearningObject[]> {
    try {
      let cursor: Cursor<LearningObjectDocument> = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .find<LearningObjectDocument>({ children: params.query.id });
      cursor = this.applyCursorFilters<LearningObjectDocument>(
        cursor,
        params.query,
      );
      const parentDocs = await cursor.toArray();
      const parents = await this.bulkGenerateLearningObjects(
        parentDocs,
        params.query.full,
      );
      return parents;
    } catch (e) {
      return Promise.reject(e);
    }
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

  public async toggleLock(
    id: string,
    lock?: LearningObjectLock,
  ): Promise<void> {
    try {
      const updates: any = {
        lock,
      };

      if (
        lock &&
        (lock.restrictions.indexOf(Restriction.FULL) > -1 ||
          lock.restrictions.indexOf(Restriction.PUBLISH) > -1)
      ) {
        updates.published = false;
      }

      await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .update(
          { _id: id },
          lock ? { $set: updates } : { $unset: { lock: null } },
        );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
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
   * Get LearningObject IDs owned by User
   *
   * @param {string} username
   * @returns {string[]}
   * @memberof MongoDriver
   */
  async getUserObjects(username: string): Promise<string[]> {
    try {
      const id = await this.findUser(username);
      const user = await this.db
        .collection(COLLECTIONS.USERS)
        .findOne<UserDocument>({ _id: id });
      return user.objects;
    } catch (e) {
      return Promise.reject(`Problem fetch User's Objects. Error: ${e}`);
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
      throw new Error('No user with username or email' + username + ' exists.');
    return `${userRecord._id}`;
  }

  /**
   * Look up a learning object by its author and name.
   * @async
   *
   * @param {UserID} author the author's unique database id
   * @param {string} name the object's name
   *
   * @returns {LearningObjectID}
   */
  async findLearningObject(username: string, name: string): Promise<string> {
    try {
      const authorID = await this.findUser(username);
      const doc = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .findOne<LearningObjectDocument>({
          authorID: authorID,
          name: name,
        });
      if (!doc)
        return Promise.reject(
          'No learning object ' + name + ' for the given user',
        );
      return Promise.resolve(doc._id);
    } catch (e) {
      return Promise.reject(e);
    }
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
  async fetchLearningObject(
    id: string,
    full?: boolean,
    accessUnpublished?: boolean,
  ): Promise<LearningObject> {
    const object = await this.db
      .collection<LearningObjectDocument>(COLLECTIONS.LEARNING_OBJECTS)
      .findOne({ _id: id });
    const author = await this.fetchUser(object.authorID);

    const learningObject = await this.generateLearningObject(
      author,
      object,
      full,
    );

    // set outcome ids and their mappings' ids
    if (Array.isArray(learningObject.outcomes) && learningObject.outcomes.length) {
        let outcomes = [];

        for (let o of learningObject.outcomes) {
          const newOutcome = LearningOutcome.instantiate(learningObject, Object.assign(o, { id: o._id }));

          let mappings = [];

          for (let mapping of newOutcome.mappings) {
            const newMapping = Object.assign(mapping, { id: mapping._id });
            delete newMapping._id;
            mappings.push(newMapping);
          }

          newOutcome.mappings = mappings;

          delete newOutcome._id;
          outcomes.push(newOutcome);
        }

        learningObject.outcomes = outcomes;
    }

    if (!accessUnpublished && !learningObject.published)
      return Promise.reject(
        'User does not have access to the requested resource.',
      );
    return learningObject;
  }

  /**
   * Return literally all objects. Very expensive.
   * @returns {Cursor<LearningObjectRecord>[]} cursor of literally all objects
   */
  async fetchAllObjects(
    accessUnpublished?: boolean,
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      const query: any = {};

      if (!accessUnpublished) {
        query.published = true;
      }

      let objectCursor = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .find<LearningObjectDocument>(query);
      const totalRecords = await objectCursor.count();
      objectCursor = this.applyCursorFilters(objectCursor, { page, limit });

      const docs = await objectCursor.toArray();
      const learningObjects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
      );
      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords,
      });
    } catch (e) {
      return Promise.reject(`Error fetching all learning objects. Error: ${e}`);
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
        learningObject.id = doc._id;
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
  async fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: 1 | -1,
  ): Promise<LearningObject[]> {
    try {
      const query: any = { _id: { $in: ids } };
      if (!accessUnpublished) query.published = true;
      let objectCursor = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .find<LearningObjectDocument>(query);

      objectCursor = this.applyCursorFilters(objectCursor, {
        orderBy,
        sortType,
      });

      const docs = await objectCursor.toArray();

      const learningObjects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
        full,
      );

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fetching LearningObjects: ${ids}. Error: ${e}`,
      );
    }
  }

  /* Search for objects on CuBE criteria.
    *
    * TODO: Efficiency very questionable.
    *      Convert to streaming algorithm if possible.
    *
    */
  // tslint:disable-next-line:member-ordering
  async searchObjects(params: {
    name: string;
    author: string;
    collection: string;
    status: string[];
    length: string[];
    level: string[];
    standardOutcomeIDs: string[];
    text: string;
    accessUnpublished?: boolean;
    orderBy?: string;
    sortType?: 1 | -1;
    page?: number;
    limit?: number;
    released?: boolean;
  }): Promise<{ objects: LearningObject[]; total: number }> {
    try {
      // Query for users
      const authorRecords: {
        _id: string;
        username: string;
      }[] = await this.matchUsers(params.author, params.text);

      const exactAuthor =
        params.author && authorRecords && authorRecords.length ? true : false;

      // Query by LearningOutcomes' mappings
      let outcomeIDs;
      if (params.standardOutcomeIDs) {
        const outcomeRecords: LearningOutcomeDocument[] = await this.matchOutcomes(
          params.standardOutcomeIDs,
        );
        outcomeIDs = outcomeRecords ? outcomeRecords.map(doc => doc._id) : null;
      }

      let query: any = this.buildSearchQuery(
        params.accessUnpublished,
        params.text,
        authorRecords,
        params.status,
        params.length,
        params.level,
        outcomeIDs,
        params.name,
        params.collection,
        exactAuthor,
        params.released,
      );

      let objectCursor = await this.db
        .collection(COLLECTIONS.LEARNING_OBJECTS)
        .find<LearningObjectDocument>(query)
        .project({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });

      const totalRecords = await objectCursor.count();

      if (typeof params.sortType === 'string') {
        // @ts-ignore
        sortType = parseInt(sortType, 10) || 1;
      }

      // Paginate if has limiter
      objectCursor = this.applyCursorFilters(objectCursor, {
        page: params.page,
        limit: params.limit,
        orderBy: params.orderBy,
        sortType: params.sortType,
      });

      const docs = await objectCursor.toArray();

      const learningObjects: LearningObject[] = await this.bulkGenerateLearningObjects(
        docs,
        false,
      );

      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords,
      });
    } catch (e) {
      return Promise.reject('Error suggesting objects' + e);
    }
  }

  async findSingleFile(params: {
    learningObjectId: string;
    fileId: string;
  }): Promise<LearningObjectFile> {
    try {
      const fileMetaData = await this.db
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

      // Object contains materials property.
      // Files array within materials will alway contain one element
      return fileMetaData.materials.files[0];
    } catch (e) {
      Promise.reject(e);
    }
  }

  /**
   * Builds query object for Learning Object search
   *
   * @private
   * @param {boolean} accessUnpublished
   * @param {string} text
   * @param {string[]} authorIDs
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} outcomeIDs
   * @param {string} name
   * @returns
   * @memberof MongoDriver
   */
  private buildSearchQuery(
    accessUnpublished: boolean,
    text: string,
    authors: { _id: string; username: string }[],
    status: string[],
    length: string[],
    level: string[],
    outcomeIDs: string[],
    name: string,
    collection: string,
    exactAuthor?: boolean,
    released?: boolean,
  ) {
    let query: any = <any>{};
    if (!accessUnpublished) {
      query.published = true;
    }
    if (released) {
      // Check that the learning object does not have a download restriction
      query['lock.restrictions'] = { $nin: [Restriction.DOWNLOAD] };
    }
    // Search By Text
    if (text || text === '') {
      query = this.buildTextSearchQuery(
        query,
        text,
        authors,
        exactAuthor,
        status,
        length,
        level,
        outcomeIDs,
        collection,
      );
    } else {
      // Search by fields
      query = this.buildFieldSearchQuery(
        name,
        query,
        authors,
        status,
        length,
        level,
        outcomeIDs,
        collection,
        exactAuthor,
      );
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
  private buildFieldSearchQuery(
    name: string,
    query: any,
    authors: { _id: string; username: string }[],
    status: string[],
    length: string[],
    level: string[],
    outcomeIDs: string[],
    collection: string,
    exactAuthor: boolean,
  ) {
    if (name) {
      query.$text = { $search: name };
    }
    if (authors) {
      if (exactAuthor) {
        query.authorID = authors[0]._id;
      } else {
        query.$or.push(
          <any>{
            authorID: { $in: authors.map(author => author._id) },
          },
          {
            contributors: { $in: authors.map(author => author.username) },
          },
        );
      }
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
      query.collection = collection;
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
   * @param {boolean} exactAuthor
   * @param {string[]} length
   * @param {string[]} level
   * @param {string[]} outcomeIDs
   * @returns
   * @memberof MongoDriver
   */
  private buildTextSearchQuery(
    query: any,
    text: string,
    authors: { _id: string; username: string }[],
    exactAuthor: boolean,
    status: string[],
    length: string[],
    level: string[],
    outcomeIDs: string[],
    collection: string,
  ) {
    const regex = new RegExp(sanitizeRegex(text));
    query.$or = [
      { $text: { $search: text } },
      { name: { $regex: regex } },
      { contributors: { $regex: regex } },
    ];
    if (authors && authors.length) {
      if (exactAuthor) {
        query.authorID = authors[0]._id;
      } else {
        query.$or.push(
          <any>{
            authorID: { $in: authors.map(author => author._id) },
          },
          {
            contributors: { $in: authors.map(author => author._id) },
          },
        );
      }
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
      query.collection = collection;
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
    try {
      if (filters.page !== undefined && filters.page <= 0) {
        filters.page = 1;
      }
      const skip =
        filters.page && filters.limit
          ? (filters.page - 1) * filters.limit
          : undefined;

      // Paginate if has limiter
      cursor =
        skip !== undefined
          ? cursor.skip(skip).limit(filters.limit)
          : filters.limit
            ? cursor.limit(filters.limit)
            : cursor;

      // SortBy
      cursor = filters.orderBy
        ? cursor.sort(filters.orderBy, filters.sortType ? filters.sortType : 1)
        : cursor;
      return cursor;
    } catch (e) {
      console.log(e);
    }
  }
  /**
   * Gets Learning Outcome IDs that contain Standard Outcome IDs
   *
   * @private
   * @param {string[]} standardOutcomeIDs
   * @returns {Promise<LearningOutcomeDocument[]>}
   * @memberof MongoDriver
   */
  private async matchOutcomes(
    standardOutcomeIDs: string[],
  ): Promise<LearningOutcomeDocument[]> {
    return standardOutcomeIDs
      ? await this.db
          .collection(COLLECTIONS.LEARNING_OUTCOMES)
          .find<LearningOutcomeDocument>({
            mappings: { $all: standardOutcomeIDs },
          })
          .toArray()
      : null;
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
      : Promise.resolve(null);
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
          return this.fetchLearningObject(id, false, false);
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

  async fetchCollectionObjects(name: string): Promise<LearningObject[]> {
    try {
      const collection: any = await this.db
        .collection(COLLECTIONS.LO_COLLECTIONS)
        .findOne({ name }, <any>{ learningObjects: 1 });
      const objects = await Promise.all(
        collection.learningObjects.map((id: string) => {
          return this.fetchLearningObject(id, false, false);
        }),
      );
      collection.learningObjects = objects;
      return collection;
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
    isNew?: boolean,
    id?: string,
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
        authorID: authorID,
        name: object.name,
        date: object.date,
        length: object.length,
        levels: object.levels,
        goals: object.goals.map(goal => {
          return {
            text: goal.text,
          };
        }),
        materials: object.materials,
        published: object.published,
        contributors: contributorIds,
        collection: object.collection,
        lock: object.lock,
      };
      if (isNew) {
        doc._id = new ObjectID().toHexString();
      } else {
        doc._id = id;
        delete doc.outcomes;
      }
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
    const learningObject = new LearningObject(author, record.name);
    learningObject.id = record._id;
    learningObject.date = record.date;
    learningObject.length = record.length;
    learningObject.levels = <AcademicLevel[]>record.levels;
    learningObject.materials = <Material>record.materials;
    record.published ? learningObject.publish() : learningObject.unpublish();
    learningObject.children = record.children;
    learningObject.lock = record.lock;
    learningObject.collection = record.collection;
    learningObject.status = record.status;
    for (const goal of record.goals) {
      learningObject.addGoal(goal.text);
    }
    if (!full) {
      return learningObject;
    }

    // Logic for loading 'full' learning objects

    // Load Contributors
    if (record.contributors && record.contributors.length) {
      learningObject.contributors = await Promise.all(
        record.contributors.map(async user => {
          let id: string;
          if (typeof user === 'string') {
            id = user;
          } else {
            const obj = User.instantiate(user);
            id = await this.findUser(obj.username);
            reportError(
              new Error(
                `Learning object ${
                  record._id
                } contains an invalid type for contributors property.`,
              ),
            );
          }
          return this.fetchUser(id);
        }),
      );
    }
    // load outcomes
    learningObject.outcomes = await this.getAllLearningOutcomes({
      source: learningObject.id,
    });

    // for (const outcome of outcomes) {
    //   const newOutcome = learningObject.addOutcome();
    //   newOutcome.bloom = outcome.bloom;
    //   newOutcome.verb = outcome.verb;
    //   newOutcome.text = outcome.text;
    //   newOutcome.id = outcome._id;

    //   for (const rAssessment of outcome.assessments) {
    //     const assessment = newOutcome.addAssessment();
    //     assessment.plan = rAssessment.plan;
    //     assessment.text = rAssessment.text;
    //   }

    //   for (const rStrategy of outcome.strategies) {
    //     const strategy = newOutcome.addStrategy();
    //     strategy.plan = rStrategy.plan;
    //     strategy.text = rStrategy.text;
    //   }

    //   // only extract the basic info for each mapped outcome
    //   for (const mapping of outcome.mappings) {
    //     this.learningOutcomeStore.getLearningOutcome({ })
    //     newOutcome.mapTo(mapping);
    //   }
    // }

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
