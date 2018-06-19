import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import * as dotenv from 'dotenv';
import {
  LearningObject,
  LearningOutcome,
  StandardOutcome,
  User,
  AcademicLevel,
  Outcome,
} from '@cyber4all/clark-entity';
import {
  LearningObjectDocument,
  LearningOutcomeDocument,
  UserDocument,
  StandardOutcomeDocument,
} from '@cyber4all/clark-schema';
import { LearningObjectCollection } from '../interfaces/DataStore';
import * as request from 'request-promise';

dotenv.config();

export interface Collection {
  name: string;
  foreigns?: Foreign[];
  uniques?: string[];
  text?: string[];
}
export interface Foreign {
  name: string;
  data: ForeignData;
}

export interface ForeignData {
  target: string;
  child: boolean;
  registry?: string;
}
export class COLLECTIONS {
  public static User: Collection = {
    name: 'users',
    foreigns: [
      {
        name: 'objects',
        data: {
          target: 'LearningObject',
          child: true,
        },
      },
    ],
    uniques: ['username'],
  };
  public static LearningObject: Collection = {
    name: 'objects',
    foreigns: [
      {
        name: 'authorID',
        data: {
          target: 'User',
          child: false,
          registry: 'objects',
        },
      },
      {
        name: 'outcomes',
        data: {
          target: 'LearningOutcome',
          child: true,
          registry: 'source',
        },
      },
    ],
  };
  public static LearningOutcome: Collection = {
    name: 'learning-outcomes',
    foreigns: [
      {
        name: 'source',
        data: {
          target: 'LearningObject',
          child: false,
          registry: 'outcomes',
        },
      },
    ],
  };
  public static StandardOutcome: Collection = { name: 'outcomes' };
  public static LearningObjectCollection: Collection = { name: 'collections' };
}

const COLLECTIONS_MAP = new Map<string, Collection>();
COLLECTIONS_MAP.set('User', COLLECTIONS.User);
COLLECTIONS_MAP.set('LearningObject', COLLECTIONS.LearningObject);
COLLECTIONS_MAP.set('LearningOutcome', COLLECTIONS.LearningOutcome);
COLLECTIONS_MAP.set('StandardOutcome', COLLECTIONS.StandardOutcome);
COLLECTIONS_MAP.set(
  'LearningObjectCollection',
  COLLECTIONS.LearningObjectCollection,
);

export class MongoDriver implements DataStore {
  private db: Db;

  constructor() {
    const dburi =
      process.env.NODE_ENV === 'production'
        ? process.env.CLARK_DB_URI.replace(
            /<DB_PASSWORD>/g,
            process.env.CLARK_DB_PWD,
          )
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME)
        : process.env.CLARK_DB_URI_DEV.replace(
            /<DB_PASSWORD>/g,
            process.env.CLARK_DB_PWD,
          )
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
    this.connect(dburi);
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
      this.db = await MongoClient.connect(dbURI);
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
    this.db.close();
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
      const authorID = await this.findUser(object.author.username);
      const author = await this.fetchUser(authorID);
      if (!author.emailVerified) object.unpublish();
      const doc = await this.documentLearningObject(object, true);
      const id = await this.insert(COLLECTIONS.LearningObject, doc);

      await this.insertLearningOutcomes(
        {
          learningObjectID: id,
          learningObjectName: object.name,
          authorName: author.name,
        },
        object.outcomes,
      );
      return id;
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
  async insertChild(parentId: string, childId: string): Promise<any> {
    try {
      const childObjectExists =
        (await this.db
          .collection(COLLECTIONS.LearningObject.name)
          .find({ _id: childId }, { _id: 1 })
          .limit(1)
          .count()) > 0;

      if (childObjectExists) {
        // TODO: return an error if $addToSet doesn't modify the set (i.e. the child is already added)
        await this.db
          .collection(COLLECTIONS.LearningObject.name)
          .update({ _id: parentId }, { $addToSet: { children: childId } });
      } else {
        return Promise.reject({
          message: `${childId} does not exist`,
          status: 404,
        });
      }
    } catch (error) {
      return Promise.reject({
        message: `Problem inserting child ${childId} into Object ${parentId}`,
        status: 400,
      });
    }
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
        .collection(COLLECTIONS.LearningObject.name)
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
   * Insert a learning outcome into the database.
   * @async
   *
   * @param {LearningOutcomeInsert} record
   *
   * @returns {LearningOutcomeID} the database id of the new record
   */
  private async insertLearningOutcomes(
    source: {
      learningObjectID: string;
      learningObjectName: string;
      authorName: string;
    },
    outcomes: LearningOutcome[],
  ): Promise<void> {
    try {
      for (const outcome of outcomes) {
        const doc = await this.documentLearningOutcome(outcome, source, true);
        await this.insert(COLLECTIONS.LearningOutcome, doc);
      }
    } catch (e) {
      return Promise.reject('Problem inserting Learning Outcomes:\n\t' + e);
    }
  }

  ////////////////////////////
  // MAPPING AND REGISTRIES //
  ////////////////////////////

  /**
   * Add a mapping for an outcome.
   * @async
   *
   * @param {OutcomeID} outcome the user's outcome
   * @param {OutcomeID} mapping the newly associated outcome's id
   */
  async mapOutcome(outcome: string, mapping: string): Promise<void> {
    /*
         * TODO: alter register (and others) to take schema, not collection
         *       perform validation in register (code is already written in comment down there)
         */
    // validate mapping, since it can't (currently) happen in generic register function
    // NOTE: this is a temporary fix. Do TODO above!
    const target = await this.db
      .collection('outcomes')
      .findOne({ _id: mapping });
    if (!target)
      return Promise.reject(
        'Registration failed: no mapping ' + mapping + 'found in outcomes',
      );
    return this.register(
      COLLECTIONS.LearningOutcome,
      outcome,
      'mappings',
      mapping,
    );
  }

  /**
   * Undo a mapping for an outcome.
   * @async
   *
   * @param {OutcomeID} outcome the user's outcome
   * @param {OutcomeID} mapping the newly associated outcome's id
   */
  async unmapOutcome(outcome: string, mapping: string): Promise<void> {
    return this.unregister(
      COLLECTIONS.LearningOutcome,
      outcome,
      'mappings',
      mapping,
    );
  }

  /**
   * Reorder an outcome in an object's outcomes list.
   * @async
   *
   * @param {LearningObjectID} object the object
   * @param {LearningOutcomeID} outcome the outcome being reordered
   * @param {number} index the new index for the outcome
   */
  async reorderOutcome(
    object: string,
    outcome: string,
    index: number,
  ): Promise<void> {
    return this.reorder(
      COLLECTIONS.LearningObject,
      object,
      'outcomes',
      outcome,
      index,
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
  async editLearningObject(id: string, object: LearningObject): Promise<void> {
    try {
      const old = await this.fetch<LearningObjectDocument>(
        COLLECTIONS.LearningObject,
        id,
      );
      const author = await this.fetchUser(old.authorID);
      if (!author.emailVerified) object.unpublish();

      const doc = await this.documentLearningObject(object, false, id);
      // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
      await this.edit(COLLECTIONS.LearningObject, id, doc);

      const outcomesToAdd = [];
      let oldOutcomes: Set<string> | string[] = new Set(old.outcomes);
      for (const outcome of object.outcomes) {
        try {
          // Check if outcome already exists
          const outcomeID = await this.findLearningOutcome(id, outcome.tag);
          // Remove from array of outcomes
          oldOutcomes.delete(outcomeID);
          // Edit Learning Outcome
          await this.editLearningOutcome(outcomeID, outcome, {
            learningObjectID: id,
            learningObjectName: doc.name,
            authorName: object.author.name,
          });
        } catch (e) {
          // If outcome does not exist, add it;
          outcomesToAdd.push(outcome);
        }
      }

      // Insert new Learning Outcomes
      if (outcomesToAdd.length) {
        await this.insertLearningOutcomes(
          {
            learningObjectID: id,
            learningObjectName: doc.name,
            authorName: object.author.name,
          },
          outcomesToAdd,
        );
      }

      // Remove deleted outcomes
      oldOutcomes = Array.from(oldOutcomes);

      if (oldOutcomes.length) {
        for (const outcomeID of oldOutcomes) {
          await this.remove(COLLECTIONS.LearningOutcome, outcomeID);
        }
      }

      // ensure all outcomes have the right name_ and date tag
      await this.db.collection(COLLECTIONS.LearningOutcome.name).updateMany(
        { source: id },
        {
          $set: {
            name: object.name,
            date: object.date,
          },
        },
      );

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async toggleLock(id: string, lock?: { date: string }): Promise<void> {
    try {
      await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .update(
          { _id: id },
          lock
            ? { $set: { lock: lock, published: false } }
            : { $unset: { lock: null } },
        );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  public async togglePublished(
    username: string,
    id: string,
    published: boolean,
  ): Promise<void> {
    try {
      const userID = await this.findUser(username);
      const user = await this.fetchUser(userID);
      // check if user is verified and if user is attempting to publish. If not verified and attempting to publish reject
      if (!user.emailVerified && published)
        return Promise.reject(
          `Invalid access. User must be verified to publish Learning Objects`,
        );
      // else
      const object = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOne({ _id: id }, { _id: 0, lock: 1 });
      if (object.lock) {
        return Promise.reject(
          `Unable to publish. Learning Object locked by reviewer.`,
        );
      }
      await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .update(
          { _id: id, lock: { $exists: false } },
          { $set: { published: published } },
        );
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Edit a learning outcome.
   * @async
   *
   * @param {LearningOutcomeID} id which document to change
   * @param {LearningOutcomeEdit} record the values to change to
   */
  private async editLearningOutcome(
    id: string,
    outcome: LearningOutcome,
    source: {
      learningObjectID: string;
      learningObjectName: string;
      authorName: string;
    },
  ): Promise<void> {
    const doc: LearningOutcomeDocument = await this.documentLearningOutcome(
      outcome,
      source,
    );
    return this.edit(COLLECTIONS.LearningOutcome, id, doc);
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
    // remove object from all carts first
    try {
      await this.cleanObjectsFromCarts([id]);
    } catch (error) {
      console.log(error);
    }
    // now remove from database
    return this.remove(COLLECTIONS.LearningObject, id);
  }

  /**
   * Remove a learning object (and its outcomes) from the database.
   * @async
   *
   * @param {LearningObjectID} id which document to delete
   */
  async deleteMultipleLearningObjects(ids: string[]): Promise<any> {
    // remove objects from all carts first
    try {
      await this.cleanObjectsFromCarts(ids);
    } catch (error) {
      console.log(error);
    }

    // now remove objects from database
    return Promise.all(
      ids.map(id => {
        return this.remove(COLLECTIONS.LearningObject, id);
      }),
    );
  }

  /**
   * Removes learning object ids from all carts that reference them
   * @param ids Array of string ids
   */
  async cleanObjectsFromCarts(ids: Array<string>): Promise<void> {
    return request.patch(
      process.env.CART_SERVICE_URI +
        '/libraries/learning-objects/' +
        ids.join(',') +
        '/clean',
    );
  }

  /**
   * Remove a learning outcome from the database.
   * @async
   *
   * @param {LearningOutcomeID} id which document to delete
   */
  private async deleteLearningOutcome(id: string): Promise<void> {
    try {
      // find any outcomes mapping to this one, and unmap them
      //  this data assurance step is in the general category of
      //  'any other foreign keys pointing to this collection and id'
      //  which is excessive enough to justify this specific solution
      await this.db
        .collection(COLLECTIONS.LearningOutcome.name)
        .updateMany({ mappings: id }, { $pull: { $mappings: id } });
      // remove this outcome
      return this.remove(COLLECTIONS.LearningOutcome, id);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  ///////////////////////////
  // INFORMATION RETRIEVAL //
  ///////////////////////////

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
        .collection(COLLECTIONS.User.name)
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
    try {
      const query = {};
      if (isEmail(username)) {
        query['email'] = username;
      } else {
        query['username'] = username;
      }
      const userRecord = await this.db
        .collection(COLLECTIONS.User.name)
        .findOne<UserDocument>(query);
      if (!userRecord)
        return Promise.reject(
          'No user with username or email' + username + ' exists.',
        );
      return `${userRecord._id}`;
    } catch (e) {
      return Promise.reject(e);
    }
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
        .collection(COLLECTIONS.LearningObject.name)
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
   * Look up a learning outcome by its source and tag.
   * @async
   *
   * @param {LearningObjectID} source the object source's unique database id
   * @param {number} tag the outcome's unique identifier
   *
   * @returns {LearningOutcomeID}
   */
  private async findLearningOutcome(
    source: string,
    tag: number,
  ): Promise<string> {
    try {
      const doc = await this.db
        .collection(COLLECTIONS.LearningOutcome.name)
        .findOne<LearningOutcomeDocument>({
          source: source,
          tag: tag,
        });
      if (!doc)
        return Promise.reject(
          'No learning outcome ' + tag + ' for the given learning object',
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
        .collection(COLLECTIONS.StandardOutcome.name)
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
    const doc = await this.fetch<UserDocument>(COLLECTIONS.User, id);
    const user = this.generateUser(doc);
    return user;
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
    const object = await this.fetch<LearningObjectDocument>(
      COLLECTIONS.LearningObject,
      id,
    );
    const author = await this.fetchUser(object.authorID);

    const learningObject = await this.generateLearningObject(
      author,
      object,
      full,
    );
    if (!accessUnpublished && !learningObject.published)
      return Promise.reject(
        'User does not have access to the requested resource.',
      );
    return learningObject;
  }

  /**
   * Fetch the learning outcome document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {LearningOutcomeRecord}
   */
  private async fetchLearningOutcome(id: string): Promise<LearningOutcome> {
    try {
      const record = await this.fetch<LearningOutcomeDocument>(
        COLLECTIONS.LearningOutcome,
        id,
      );
      const outcome = await this.generateLearningOutcome(record);
      return outcome;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Fetch the generic outcome document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {OutcomeRecord}
   */
  private async fetchOutcome(id: string): Promise<Outcome> {
    try {
      const record = await this.fetch<StandardOutcomeDocument>(
        COLLECTIONS.StandardOutcome,
        id,
      );
      const outcome = await this.generateStandardOutcome(record);
      return outcome;
    } catch (e) {
      return Promise.reject(e);
    }
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
    if (page !== undefined && page <= 0) {
      page = 1;
    }
    const skip = page && limit ? (page - 1) * limit : undefined;

    try {
      const query: any = {};

      if (!accessUnpublished) {
        query.published = true;
      }

      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query);
      const totalRecords = await objectCursor.count();
      objectCursor =
        skip !== undefined
          ? objectCursor.skip(skip).limit(limit)
          : limit
            ? objectCursor.limit(limit)
            : objectCursor;
      const objects = await objectCursor.toArray();

      const learningObjects: LearningObject[] = [];

      for (const object of objects) {
        const author = await this.fetchUser(object.authorID);
        const learningObject = await this.generateLearningObject(
          author,
          object,
          false,
        );

        if (accessUnpublished) {
          learningObject.id = object._id;
        }

        learningObjects.push(learningObject);
      }

      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords,
      });
    } catch (e) {
      return Promise.reject(`Error fetching all learning objects. Error: ${e}`);
    }
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
    sortType?: number,
  ): Promise<LearningObject[]> {
    try {
      const query: any = { _id: { $in: ids } };
      if (!accessUnpublished) query.published = true;
      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query);

      objectCursor = objectCursor.sort(
        orderBy ? orderBy : 'name',
        sortType ? sortType : 1,
      );

      const objects = await objectCursor.toArray();

      const learningObjects: LearningObject[] = [];

      for (const object of objects) {
        const author = await this.fetchUser(object.authorID);
        const learningObject = await this.generateLearningObject(
          author,
          object,
          full,
        );
        if (accessUnpublished) learningObject.id = object._id;
        learningObjects.push(learningObject);
      }

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
    * TODO: behavior is currently very strict (ex. name, author must exactly match)
    *       Consider text-indexing these fields to exploit mongo $text querying.
    */
  // tslint:disable-next-line:member-ordering
  async searchObjects(
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    accessUnpublished?: boolean,
    orderBy?: string,
    sortType?: number,
    page?: number,
    limit?: number,
  ): Promise<{ objects: LearningObject[]; total: number }> {
    if (page !== undefined && page <= 0) page = 1;
    const skip = page && limit ? (page - 1) * limit : undefined;
    try {
      // Query for users
      const authorRecords: UserDocument[] = await this.matchUsers(author, text);
      const authorIDs = authorRecords
        ? authorRecords.map(doc => doc._id)
        : null;
      const exactAuthor =
        author && authorIDs && authorIDs.length ? true : false;
      // Query by LearningOutcomes' mappings
      const outcomeRecords: LearningOutcomeDocument[] = await this.matchOutcomes(
        standardOutcomeIDs,
      );
      const outcomeIDs = outcomeRecords
        ? outcomeRecords.map(doc => doc._id)
        : null;

      let query: any = this.buildSearchQuery(
        accessUnpublished,
        text,
        authorIDs,
        length,
        level,
        outcomeIDs,
        name,
        exactAuthor,
      );

      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });

      const totalRecords = await objectCursor.count();

      // Paginate if has limiter
      objectCursor =
        skip !== undefined
          ? objectCursor.skip(skip).limit(limit)
          : limit
            ? objectCursor.limit(limit)
            : objectCursor;

      // SortBy
      objectCursor = orderBy
        ? objectCursor.sort(orderBy, sortType ? sortType : 1)
        : objectCursor;
      const objects = await objectCursor.toArray();

      const learningObjects: LearningObject[] = [];

      for (const object of objects) {
        const author = await this.fetchUser(object.authorID);
        const learningObject = await this.generateLearningObject(
          author,
          object,
          false,
        );
        if (accessUnpublished) {
          learningObject.id = object._id;
        }
        learningObjects.push(learningObject);
      }

      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords,
      });
    } catch (e) {
      return Promise.reject('Error suggesting objects' + e);
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
    authorIDs: string[],
    length: string[],
    level: string[],
    outcomeIDs: string[],
    name: string,
    exactAuthor?: boolean,
  ) {
    let query: any = <any>{};
    if (!accessUnpublished) {
      query.published = true;
    }
    // Search By Text
    if (text || text === '') {
      query.$or = [
        { $text: { $search: text } },
        { name: { $regex: new RegExp(text, 'ig') } },
      ];
      if (authorIDs && authorIDs.length) {
        if (exactAuthor) {
          query.authorID = authorIDs[0];
        } else {
          query.$or.push(<any>{
            authorID: { $in: authorIDs },
          });
        }
      }
      if (length) {
        query.length = { $in: length };
      }
      if (level) {
        query.levels = { $in: level };
      }
      if (outcomeIDs) {
        query.outcomes = outcomeIDs.length
          ? { $in: outcomeIDs }
          : ['DONT MATCH ME'];
      }
    } else {
      // Search by fields
      if (name) {
        query.$text = { $search: name };
      }
      if (authorIDs) {
        query.authorID = { $in: authorIDs };
      }
      if (length) {
        query.length = { $in: length };
      }
      if (level) {
        query.levels = { $in: level };
      }
      if (outcomeIDs) {
        query.outcomes = { $in: outcomeIDs };
      }
    }
    return query;
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
          .collection(COLLECTIONS.LearningOutcome.name)
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
  ): Promise<UserDocument[]> {
    const query = {
      $or: [{ $text: { $search: author ? author : text } }],
    };

    if (text) {
      (<any[]>query.$or).push(
        { username: { $regex: new RegExp(text, 'ig') } },
        { name: { $regex: new RegExp(text, 'ig') } },
        { email: { $regex: new RegExp(text, 'ig') } },
      );
    }
    return author || text
      ? await this.db
          .collection(COLLECTIONS.User.name)
          .find<UserDocument>(query, { score: { $meta: 'textScore' } })
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
      const collectionsCursor = await this.db
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .find();
      return collectionsCursor.toArray();
    } catch (e) {
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
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .findOne({ name: name });
      const objects = [];
      for (const id of collection.learningObjects) {
        try {
          const object = await this.fetchLearningObject(id, false, false);
          objects.push(object);
        } catch (e) {
          // console.log('Object is unpublished. Do not add, continue');
        }
      }
      collection.learningObjects = objects;
      return collection;
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
      const author = await this.fetchUser(authorID);
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
        outcomes: [],
        materials: object.materials,
        published: object.published,
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
   * Converts Learning Outcome to Document
   *
   * @private
   * @param {LearningOutcome} outcome
   * @param {{
   *       learningObjectID: string;
   *       learningObjectName: string;
   *       authorName: string;
   *     }} source
   * @param {boolean} [isNew]
   * @returns {Promise<LearningOutcomeDocument>}
   * @memberof MongoDriver
   */
  private async documentLearningOutcome(
    outcome: LearningOutcome,
    source: {
      learningObjectID: string;
      learningObjectName: string;
      authorName: string;
    },
    isNew?: boolean,
  ): Promise<LearningOutcomeDocument> {
    try {
      const doc: LearningOutcomeDocument = {
        source: source.learningObjectID,
        tag: outcome.tag,
        author: source.authorName,
        name: source.learningObjectName,
        date: outcome.date,
        outcome: outcome.outcome,
        bloom: outcome.bloom,
        verb: outcome.verb,
        text: outcome.text,
        assessments: outcome.assessments.map(assessment => {
          return {
            plan: assessment.plan,
            text: assessment.text,
          };
        }),
        strategies: outcome.strategies.map(strategy => {
          return { plan: strategy.plan, text: strategy.text };
        }),
        mappings: outcome.mappings.map(mapping => mapping.id),
      };

      if (isNew) {
        doc._id = new ObjectID().toHexString();
      }
      return doc;
    } catch (e) {
      return Promise.reject(
        `Problem creating document for Learning Outcome. Error:${e}`,
      );
    }
  }
  /**
   * Generates User object from Document
   *
   * @private
   * @param {UserDocument} userRecord
   * @returns {User}
   * @memberof MongoDriver
   */
  private generateUser(userRecord: UserDocument): User {
    const user = new User(
      userRecord.username,
      userRecord.name,
      userRecord.email,
      userRecord.organization,
      null,
    );
    user.emailVerified = userRecord.emailVerified
      ? userRecord.emailVerified
      : false;
    return user;
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
    learningObject.date = record.date;
    learningObject.length = record.length;
    learningObject.levels = <AcademicLevel[]>record.levels;
    learningObject.materials = record.materials;
    record.published ? learningObject.publish() : learningObject.unpublish();
    learningObject.children = record.children;
    learningObject.lock = record.lock;
    for (const goal of record.goals) {
      learningObject.addGoal(goal.text);
    }
    if (!full) {
      return learningObject;
    }

    // Logic for loading 'full' learning objects

    // load each outcome
    for (const outcomeid of record.outcomes) {
      const rOutcome = await this.fetchLearningOutcome(outcomeid);

      const outcome = learningObject.addOutcome();
      outcome.bloom = rOutcome.bloom;
      outcome.verb = rOutcome.verb;
      outcome.text = rOutcome.text;
      for (const rAssessment of rOutcome.assessments) {
        const assessment = outcome.addAssessment();
        assessment.plan = rAssessment.plan;
        assessment.text = rAssessment.text;
      }
      for (const rStrategy of rOutcome.strategies) {
        const strategy = outcome.addStrategy();
        strategy.plan = rStrategy.plan;
        strategy.text = rStrategy.text;
      }

      // only extract the basic info for each mapped outcome
      for (const mapping of rOutcome.mappings) {
        outcome.mapTo(mapping);
      }
    }

    return learningObject;
  }
  /**
   * Generates LearningOutcome from Document
   *
   * @private
   * @param {LearningOutcomeDocument} record
   * @returns {Promise<LearningOutcome>}
   * @memberof MongoDriver
   */
  private async generateLearningOutcome(
    record: LearningOutcomeDocument,
  ): Promise<LearningOutcome> {
    try {
      const outcome = new LearningOutcome(new LearningObject());
      outcome.bloom = record.bloom;
      outcome.verb = record.verb;
      outcome.text = record.text;
      // Add assessments
      for (const rAssessment of record.assessments) {
        const assessment = outcome.addAssessment();
        assessment.plan = rAssessment.plan;
        assessment.text = rAssessment.text;
      }
      // Add Strategies
      for (const rStrategy of record.strategies) {
        const strategy = outcome.addStrategy();
        strategy.plan = rStrategy.plan;
        strategy.text = rStrategy.text;
      }
      for (const mappingID of record.mappings) {
        const mapping = await this.fetchOutcome(mappingID);
        outcome.mapTo(mapping);
      }
      return outcome;
    } catch (e) {
      return Promise.reject(`Problem generating LearningOutcome. Error: ${e}`);
    }
  }
  /**
   * Generates Outcome from Document
   *
   * @private
   * @param {StandardOutcomeDocument} record
   * @returns {Outcome}
   * @memberof MongoDriver
   */
  private generateStandardOutcome(record: StandardOutcomeDocument): Outcome {
    const outcome: Outcome = {
      id: record._id,
      author: record.author,
      name: record.name,
      date: record.date,
      outcome: record.outcome,
    };

    return outcome;
  }

  /**
   * Reject promise if any foreign keys in a record do not exist.
   * @async
   *
   * @param {Function} schema provides information for each foreign key
   * @param {Record} record which record to validate
   * @param {Set<string>} foreigns which fields to check
   *
   * @returns none, but promise will be rejected if there is a problem
   */
  private async validateForeignKeys<T>(
    record: T,
    foreigns: Foreign[],
  ): Promise<void> {
    try {
      if (foreigns)
        for (const foreign of foreigns) {
          const data = foreign.data;
          // get id's to check, as an array
          let keys = record[foreign.name];
          if (!(keys instanceof Array)) keys = [keys];
          // fetch foreign document and reject if it doesn't exist
          for (const key of keys) {
            const collection = COLLECTIONS_MAP.get(data.target);
            const count = await this.db
              .collection(collection.name)
              .count({ _id: key });
            if (count === 0) {
              return Promise.reject(
                'Foreign key error for ' +
                  record +
                  ': ' +
                  key +
                  ' not in ' +
                  data.target +
                  ' collection',
              );
            }
          }
        }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject('Problem validating key constraint :\n\t' + e);
    }
  }

  /**
   * Add an item's id to a foreign registry.
   * @async
   *
   * @param {string} collection where to find the foreign registry owner
   * @param {RecordID} owner the foreign registry owner
   * @param {string} registry field name of the registry
   * @param {RecordID} item which item to add
   */
  private async register(
    collection: Collection,
    owner: string,
    registry: string,
    item: string,
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      const record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Registration failed: no owner ' +
            owner +
            'found in ' +
            collection.name,
        );

      const pushdoc = {};
      pushdoc[registry] = item;

      await this.db
        .collection(collection.name)
        .updateOne({ _id: owner }, { $push: pushdoc });
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem registering to a ' +
          collection.name +
          ' ' +
          registry +
          ' field:\n\t' +
          e,
      );
    }
  }

  /**
   * Remove an item's id from a foreign registry.
   * @async
   *
   * @param {string} collection where to find the foreign registry owner
   * @param {RecordID} owner the foreign registry owner
   * @param {string} registry field name of the registry
   * @param {RecordID} item which item to remove
   */
  private async unregister(
    collection: Collection,
    owner: string,
    registry: string,
    item: string,
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      const record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Un-registration failed: no record ' +
            owner +
            'found in ' +
            collection,
        );
      if (!record[registry].includes(item)) {
        return Promise.reject(
          'Un-registration failed: record ' +
            owner +
            ' s' +
            registry +
            ' field has no element ' +
            item,
        );
      }

      const pulldoc = {};
      pulldoc[registry] = item;

      await this.db
        .collection(collection.name)
        .updateOne({ _id: owner }, { $pull: pulldoc });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem un-registering from a ' +
          collection.name +
          ' ' +
          registry +
          ' field:\n\t' +
          e,
      );
    }
  }

  /**
   * Reorder an item in a registry.
   * @async
   *
   * @param {string} collection where to find the registry owner
   * @param {RecordID} owner the registry owner
   * @param {string} registry field name of the registry
   * @param {RecordID} item which item to move
   * @param {number} index the new index for item
   */
  private async reorder(
    collection: Collection,
    owner: string,
    registry: string,
    item: string,
    index: number,
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      const record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Reorder failed: no record ' + owner + 'found in ' + collection.name,
        );
      if (!record[registry].includes(item)) {
        return Promise.reject(
          'Reorder failed: record ' +
            owner +
            ' s' +
            registry +
            ' field has no element ' +
            item,
        );
      }
      if (index < 0)
        return Promise.reject('Reorder failed: index cannot be negative');
      if (index >= record[registry].length) {
        return Promise.reject(
          'Reorder failed: index exceeds length of ' + registry + ' field',
        );
      }

      // perform the necessary operations
      await this.unregister(collection, owner, registry, item);

      const pushdoc = {};
      pushdoc[registry] = { $each: [item], $position: index };

      await this.db
        .collection(collection.name)
        .updateOne({ _id: owner }, { $push: pushdoc });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }

  /**
   * Insert a generic item to the database.
   * @async
   *
   * @param {Function} schema provides collection/validation information
   * @param {Insert} record document to insert
   *
   * @returns {RecordID} the database id of the new record
   */
  private async insert<T>(collection: Collection, record: T): Promise<string> {
    try {
      const foreigns = collection.foreigns;
      if (foreigns) {
        // check validity of all foreign keys
        await this.validateForeignKeys(record, foreigns);
      }

      // perform the actual insert
      const insert_ = await this.db
        .collection(collection.name)
        .insertOne(record);
      const id = insert_.insertedId;

      // register the new record as needed
      if (foreigns)
        for (const foreign of foreigns) {
          const data = foreign.data;
          if (!data.child && data.registry) {
            const collection = COLLECTIONS_MAP.get(data.target);
            await this.register(
              collection,
              record[foreign.name],
              data.registry,
              `${id}`,
            );
          }
        }
      return Promise.resolve(`${id}`);
    } catch (e) {
      return Promise.reject(
        'Problem inserting a ' + collection.name + ':\n\t' + e,
      );
    }
  }

  /**
   * Edit (update without foreigns) a generic item in the database.
   * @async
   *
   * @param {Function} schema provides collection/validation information
   * @param {RecordID} id which document to edit
   * @param {Edit} record the values to change to
   */
  private async edit<T>(
    collection: Collection,
    id: string,
    record: T,
  ): Promise<void> {
    try {
      // no foreign fields, no need to validate

      // perform the actual update
      await this.db
        .collection(collection.name)
        .updateOne({ _id: id }, { $set: record });

      // registered fields must be fixed, nothing to change here

      return Promise.resolve();
    } catch (e) {
      console.log(e);
      return Promise.reject(
        'Problem editing a ' + collection.name + ':\n\t' + e,
      );
    }
  }

  /**
   * Cascade delete a record and its children.
   * @async
   *
   * @param {COLLECTIONS} collection provides collection information
   * @param {string} id the document to delete
   */
  private async remove<T>(collection: Collection, id: string): Promise<void> {
    try {
      const record = await this.db
        .collection(collection.name)
        .findOne<T>({ _id: id });

      // remove all children recursively, and unregister from parents
      const foreigns = collection.foreigns;
      if (foreigns)
        for (const foreign of foreigns) {
          const data = foreign.data;

          if (data.child) {
            // get children to remove, as an array
            let keys = record[foreign.name];
            if (!(keys instanceof Array)) keys = [keys];
            // remove each child
            for (const key of keys) {
              const collection = COLLECTIONS_MAP.get(data.target);
              await this.remove(collection, key);
            }
          }

          if (!data.child && data.registry) {
            // get registries to edit, as an array
            let keys = record[foreign.name];
            if (!(keys instanceof Array)) keys = [keys];
            // unregister from each key
            for (const key of keys) {
              const collection = COLLECTIONS_MAP.get(data.target);
              await this.unregister(collection, key, data.registry, id);
            }
          }
        }

      // perform actual deletion
      await this.db.collection(collection.name).deleteOne({ _id: id });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject('Problem deleting ' + collection + ':\n\t' + e);
    }
  }

  /**
   * Fetch a database record by its id.
   * @param {Function} schema provides collection information
   * @param {string} id the document to fetch
   */
  private async fetch<T>(collection: Collection, id: string): Promise<T> {
    const record = await this.db
      .collection(collection.name)
      .findOne<T>({ _id: id });
    if (!record)
      return Promise.reject(
        'Problem fetching a ' +
          collection.name +
          ':\n\tInvalid database id ' +
          JSON.stringify(id),
      );
    return Promise.resolve(record);
  }
}

export function isEmail(value: string): boolean {
  const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (emailPattern.test(value)) {
    return true;
  }
  return false;
}
