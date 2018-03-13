import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import * as dotenv from 'dotenv';
import {
  LearningObject,
  LearningOutcome,
  StandardOutcome,
  User,
  AcademicLevel,
  Outcome
} from '@cyber4all/clark-entity';
import {
  LearningObjectDocument,
  LearningOutcomeDocument,
  UserDocument,
  StandardOutcomeDocument
} from '@cyber4all/clark-schema';
import { LearningObjectCollection } from '../interfaces/DataStore';
dotenv.config();

export interface Collection {
  name: string;
  foreigns?: Foriegn[];
  uniques?: string[];
  text?: string[];
}
export interface Foriegn {
  name: string;
  data: ForiegnData;
}

export interface ForiegnData {
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
          child: true
        }
      }
    ],
    uniques: ['username']
  };
  public static LearningObject: Collection = {
    name: 'objects',
    foreigns: [
      {
        name: 'authorID',
        data: {
          target: 'User',
          child: false,
          registry: 'objects'
        }
      },
      {
        name: 'outcomes',
        data: {
          target: 'LearningOutcome',
          child: true,
          registry: 'source'
        }
      }
    ]
  };
  public static LearningOutcome: Collection = {
    name: 'learning-outcomes',
    foreigns: [
      {
        name: 'source',
        data: {
          target: 'LearningObject',
          child: false,
          registry: 'outcomes'
        }
      }
    ]
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
  COLLECTIONS.LearningObjectCollection
);

export class MongoDriver implements DataStore {
  private db: Db;

  constructor() {
    let dburi = '';
    if (process.env.NODE_ENV === 'test') {
      dburi = process.env.CLARK_DB_URI_TEST;
    } else {
      dburi =
        process.env.NODE_ENV === 'production'
          ? process.env.CLARK_DB_URI.replace(
              /<DB_PASSWORD>/g,
              process.env.CLARK_DB_PWD
            )
              .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
              .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME)
          : process.env.CLARK_DB_URI_DEV.replace(
              /<DB_PASSWORD>/g,
              process.env.CLARK_DB_PWD
            )
              .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
              .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
    }

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
  async connect(dburi: string): Promise<void> {
    try {
      this.db = await MongoClient.connect(dburi);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem connecting to database at ' + dburi + ':\n\t' + e
      );
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
    let authorID = await this.findUser(object.author.username);
    let author = await this.fetchUser(authorID);

    let doc = await this.documentLearningObject(object, true);
    let id = await this.insert(COLLECTIONS.LearningObject, doc);

    await this.insertLearningOutcomes(
      {
        learningObjectID: id,
        learningObjectName: object.name,
        authorName: author.name
      },
      object.outcomes
    );

    return id;
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
    outcomes: LearningOutcome[]
  ): Promise<void> {
    try {
      for (let outcome of outcomes) {
        let doc = await this.documentLearningOutcome(outcome, source, true);
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
    let target = await this.db.collection('outcomes').findOne({ _id: mapping });
    if (!target)
      return Promise.reject(
        'Registration failed: no mapping ' + mapping + 'found in outcomes'
      );
    return this.register(
      COLLECTIONS.LearningOutcome,
      outcome,
      'mappings',
      mapping
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
      mapping
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
    index: number
  ): Promise<void> {
    return this.reorder(
      COLLECTIONS.LearningObject,
      object,
      'outcomes',
      outcome,
      index
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
      let old = await this.fetch<LearningObjectDocument>(
        COLLECTIONS.LearningObject,
        id
      );

      let doc = await this.documentLearningObject(object, false, id);
      // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
      await this.edit(COLLECTIONS.LearningObject, id, doc);

      let outcomesToAdd = [];
      let oldOutcomes: Set<string> | string[] = new Set(old.outcomes);
      for (let outcome of object.outcomes) {
        try {
          // Check if outcome already exists
          let outcomeID = await this.findLearningOutcome(id, outcome.tag);
          //Remove from array of outcomes
          oldOutcomes.delete(outcomeID);
          //Edit Learning Outcome
          await this.editLearningOutcome(outcomeID, outcome, {
            learningObjectID: id,
            learningObjectName: doc.name,
            authorName: object.author.name
          });
        } catch (e) {
          //If outcome does not exist, add it;
          outcomesToAdd.push(outcome);
        }
      }

      // Insert new Learning Outcomes
      if (outcomesToAdd.length) {
        await this.insertLearningOutcomes(
          {
            learningObjectID: id,
            learningObjectName: doc.name,
            authorName: object.author.name
          },
          outcomesToAdd
        );
      }

      // Remove deleted outcomes
      oldOutcomes = Array.from(oldOutcomes);

      if (oldOutcomes.length) {
        for (let outcomeID of oldOutcomes) {
          await this.remove(COLLECTIONS.LearningOutcome, outcomeID);
        }
      }

      // ensure all outcomes have the right name_ and date tag
      await this.db.collection(COLLECTIONS.LearningOutcome.name).updateMany(
        { source: id },
        {
          $set: {
            name: object.name,
            date: object.date
          }
        }
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
    }
  ): Promise<void> {
    let doc: LearningOutcomeDocument = await this.documentLearningOutcome(
      outcome,
      source
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
    return this.remove(COLLECTIONS.LearningObject, id);
  }

  /**
   * Remove a learning object (and its outcomes) from the database.
   * @async
   *
   * @param {LearningObjectID} id which document to delete
   */
  async deleteMultipleLearningObjects(ids: string[]): Promise<any> {
    return Promise.all(
      ids.map(id => {
        return this.remove(COLLECTIONS.LearningObject, id);
      })
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
      let id = await this.findUser(username);
      let user = await this.db
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
      let query = {};
      if (isEmail(username)) {
        query['email'] = username;
      } else {
        query['username'] = username;
      }
      let userRecord = await this.db
        .collection(COLLECTIONS.User.name)
        .findOne<UserDocument>(query);
      if (!userRecord)
        return Promise.reject(
          'No user with username or email' + username + ' exists.'
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
      let authorID = await this.findUser(username);
      let doc = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOne<LearningObjectDocument>({
          authorID: authorID,
          name: name
        });
      if (!doc)
        return Promise.reject(
          "No learning object '" + name + "' for the given user"
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
    tag: number
  ): Promise<string> {
    try {
      let doc = await this.db
        .collection(COLLECTIONS.LearningOutcome.name)
        .findOne<LearningOutcomeDocument>({
          source: source,
          tag: tag
        });
      if (!doc)
        return Promise.reject(
          "No learning outcome '" + tag + "' for the given learning object"
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
    outcome: string
  ): Promise<string> {
    try {
      let tag = date + '$' + name + '$' + outcome;
      let doc = await this.db
        .collection(COLLECTIONS.StandardOutcome.name)
        .findOne<StandardOutcomeDocument>({
          tag: tag
        });
      if (!doc)
        return Promise.reject(
          "No mappings found with tag: '" + tag + "' in the database"
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
    let doc = await this.fetch<UserDocument>(COLLECTIONS.User, id);
    let user = this.generateUser(doc);
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
    accessUnpublished?: boolean
  ): Promise<LearningObject> {
    let object = await this.fetch<LearningObjectDocument>(
      COLLECTIONS.LearningObject,
      id
    );
    let author = await this.fetchUser(object.authorID);

    let learningObject = await this.generateLearningObject(
      author,
      object,
      full
    );
    if (!accessUnpublished && !learningObject.published)
      return Promise.reject(
        'User does not have access to the requested resource.'
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
      let record = await this.fetch<LearningOutcomeDocument>(
        COLLECTIONS.LearningOutcome,
        id
      );
      let outcome = await this.generateLearningOutcome(record);
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
      let record = await this.fetch<StandardOutcomeDocument>(
        COLLECTIONS.StandardOutcome,
        id
      );
      let outcome = await this.generateStandardOutcome(record);
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
    currPage?: number,
    limit?: number
  ): Promise<{ objects: LearningObject[]; total: number }> {
    if (currPage !== undefined && currPage <= 0) currPage = 1;
    let skip = currPage && limit ? (currPage - 1) * limit : undefined;
    try {
      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>({ published: true });
      let totalRecords = await objectCursor.count();
      objectCursor =
        skip !== undefined
          ? objectCursor.skip(skip).limit(limit)
          : limit ? objectCursor.limit(limit) : objectCursor;
      let objects = await objectCursor.toArray();

      let learningObjects: LearningObject[] = [];

      for (let object of objects) {
        let author = await this.fetchUser(object.authorID);
        let learningObject = await this.generateLearningObject(
          author,
          object,
          false
        );
        learningObjects.push(learningObject);
      }

      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords
      });
    } catch (e) {
      return Promise.reject(`Error fetching all learning objects. Error: ${e}`);
    }
  }

  /**
   * Fetchs the learning object documents associated with the given ids.
   *
   * @param ids array of database ids
   *
   * @returns {Cursor<LearningObjectRecord>[]}
   */
  async fetchMultipleObjects(
    ids: string[],
    full?: boolean,
    accessUnpublished?: boolean
  ): Promise<LearningObject[]> {
    try {
      let query: any = { _id: { $in: ids } };
      if (!accessUnpublished) query.published = true;
      let objects = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query)
        .toArray();

      let learningObjects: LearningObject[] = [];

      for (let object of objects) {
        let author = await this.fetchUser(object.authorID);
        let learningObject = await this.generateLearningObject(
          author,
          object,
          full
        );
        if (accessUnpublished) learningObject.id = object._id;
        learningObjects.push(learningObject);
      }

      return learningObjects;
    } catch (e) {
      return Promise.reject(
        `Problem fecthing LearningObjects: ${ids}. Error: ${e}`
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
  async searchObjects(
    name: string,
    author: string,
    length: string[],
    level: string[],
    standardOutcomeIDs: string[],
    text: string,
    orderBy?: string,
    sortType?: number,
    currPage?: number,
    limit?: number
  ): Promise<{ objects: LearningObject[]; total: number }> {
    if (currPage !== undefined && currPage <= 0) currPage = 1;
    let skip = currPage && limit ? (currPage - 1) * limit : undefined;

    try {
      // Query for users
      let authorRecords: UserDocument[] =
        author || text
          ? await this.db
              .collection(COLLECTIONS.User.name)
              .find<UserDocument>({
                $or: [
                  {
                    name: {
                      $regex: new RegExp(author ? author : text, 'ig')
                    }
                  },
                  {
                    organization: {
                      $regex: new RegExp(text, 'ig')
                    }
                  }
                ]
              })
              .toArray()
          : null;
      let authorIDs = authorRecords ? authorRecords.map(doc => doc._id) : null;

      //Query by LearningOutcomes' mappings
      let outcomeRecords: LearningOutcomeDocument[] = standardOutcomeIDs
        ? await this.db
            .collection(COLLECTIONS.LearningOutcome.name)
            .find<LearningOutcomeDocument>({
              mappings: { $all: standardOutcomeIDs }
            })
            .toArray()
        : null;
      let outcomeIDs = outcomeRecords
        ? outcomeRecords.map(doc => doc._id)
        : null;

      let query = <any>{ published: true };
      // Search By Text
      if (text || text === '') {
        query = {
          $or: [
            { name: { $regex: new RegExp(text, 'ig') } },
            {
              goals: {
                $elemMatch: { text: { $regex: new RegExp(text, 'ig') } }
              }
            }
          ],
          published: true
        };

        if (authorIDs) query.$or.push(<any>{ authorID: { $in: authorIDs } });

        if (length) query.length = { $in: length };

        if (level) query.levels = { $in: level };
        if (outcomeIDs) {
          query.outcomes = outcomeIDs.length
            ? { $in: outcomeIDs }
            : ['DONT MATCH ME'];
        }
      } else {
        // Search by fields
        if (authorIDs) query.authorID = { $in: authorIDs };
        if (name) query.name = { $regex: new RegExp(name, 'ig') };

        if (length) query.length = { $in: length };
        if (level) query.levels = { $in: level };
        if (outcomeIDs) query.outcomes = { $in: outcomeIDs };
      }

      let objectCursor = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .find<LearningObjectDocument>(query);

      let totalRecords = await objectCursor.count();

      // Paginate if has limiter
      objectCursor =
        skip !== undefined
          ? objectCursor.skip(skip).limit(limit)
          : limit ? objectCursor.limit(limit) : objectCursor;

      //SortBy
      objectCursor = orderBy
        ? objectCursor.sort(orderBy, sortType ? sortType : 1)
        : objectCursor;
      let objects = await objectCursor.toArray();

      let learningObjects: LearningObject[] = [];

      for (let object of objects) {
        let author = await this.fetchUser(object.authorID);
        let learningObject = await this.generateLearningObject(
          author,
          object,
          false
        );
        learningObjects.push(learningObject);
      }

      return Promise.resolve({
        objects: learningObjects,
        total: totalRecords
      });
    } catch (e) {
      return Promise.reject('Error suggesting objects' + e);
    }
  }

  async fetchCollections(): Promise<LearningObjectCollection[]> {
    try {
      let collectionsCursor = await this.db
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .find();
      return collectionsCursor.toArray();
    } catch (e) {
      return Promise.reject(e);
    }
  }
  async fetchCollection(name: string): Promise<LearningObjectCollection> {
    try {
      let collection = await this.db
        .collection(COLLECTIONS.LearningObjectCollection.name)
        .findOne({ name: name });
      let objects = [];
      for (let id of collection.learningObjects) {
        let object = await this.fetchLearningObject(id, false, false);
        objects.push(object);
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

  private async documentLearningObject(
    object: LearningObject,
    isNew?: boolean,
    id?: string
  ): Promise<LearningObjectDocument> {
    try {
      let authorID = await this.findUser(object.author.username);
      let author = await this.fetchUser(authorID);
      let doc: LearningObjectDocument = {
        authorID: authorID,
        name: object.name,
        date: object.date,
        length: object.length,
        levels: object.levels,
        goals: object.goals.map(goal => {
          return {
            text: goal.text
          };
        }),
        outcomes: [],
        materials: object.materials,
        published: object.published
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
        `Problem creating document for Learning Object. Error:${e}`
      );
    }
  }

  private async documentLearningOutcome(
    outcome: LearningOutcome,
    source: {
      learningObjectID: string;
      learningObjectName: string;
      authorName: string;
    },
    isNew?: boolean
  ): Promise<LearningOutcomeDocument> {
    try {
      let doc: LearningOutcomeDocument = {
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
            text: assessment.text
          };
        }),
        strategies: outcome.strategies.map(strategy => {
          return {
            plan: strategy.plan,
            text: strategy.text
          };
        }),
        mappings: outcome.mappings.map(mapping => mapping.id)
      };

      if (isNew) {
        doc._id = new ObjectID().toHexString();
      }
      return doc;
    } catch (e) {
      return Promise.reject(
        `Problem creating document for Learning Outcome. Error:${e}`
      );
    }
  }

  private generateUser(userRecord: UserDocument): User {
    let user = new User(
      userRecord.username,
      userRecord.name,
      null,
      userRecord.organization,
      null
    );
    return user;
  }

  private async generateLearningObject(
    author: User,
    record: LearningObjectDocument,
    full?: boolean
  ): Promise<LearningObject> {
    let learningObject = new LearningObject(author, record.name);
    learningObject.date = record.date;
    learningObject.length = record.length;
    learningObject.levels = <AcademicLevel[]>record.levels;
    learningObject.materials = record.materials;
    record.published ? learningObject.publish() : learningObject.unpublish();

    for (let goal of record.goals) {
      learningObject.addGoal(goal.text);
    }
    if (!full) {
      return learningObject;
    }

    // load each outcome
    for (let outcomeid of record.outcomes) {
      let rOutcome = await this.fetchLearningOutcome(outcomeid);

      let outcome = learningObject.addOutcome();
      outcome.bloom = rOutcome.bloom;
      outcome.verb = rOutcome.verb;
      outcome.text = rOutcome.text;
      for (let rAssessment of rOutcome.assessments) {
        let assessment = outcome.addAssessment();
        assessment.plan = rAssessment.plan;
        assessment.text = rAssessment.text;
      }
      for (let rStrategy of rOutcome.strategies) {
        let strategy = outcome.addStrategy();
        strategy.plan = rStrategy.plan;
        strategy.text = rStrategy.text;
      }

      // only extract the basic info for each mapped outcome
      for (let mapping of rOutcome.mappings) {
        outcome.mapTo(mapping);
      }
    }
    return learningObject;
  }

  private async generateLearningOutcome(
    record: LearningOutcomeDocument
  ): Promise<LearningOutcome> {
    try {
      let outcome = new LearningOutcome(new LearningObject());
      outcome.bloom = record.bloom;
      outcome.verb = record.verb;
      outcome.text = record.text;
      // Add assessments
      for (let rAssessment of record.assessments) {
        let assessment = outcome.addAssessment();
        assessment.plan = rAssessment.plan;
        assessment.text = rAssessment.text;
      }
      // Add Strategies
      for (let rStrategy of record.strategies) {
        let strategy = outcome.addStrategy();
        strategy.plan = rStrategy.plan;
        strategy.text = rStrategy.text;
      }
      for (let mappingID of record.mappings) {
        let mapping = await this.fetchOutcome(mappingID);
        outcome.mapTo(mapping);
      }
      return outcome;
    } catch (e) {
      return Promise.reject(`Problem generating LearningOutcome. Error: ${e}`);
    }
  }

  private generateStandardOutcome(record: StandardOutcomeDocument): Outcome {
    let outcome: Outcome = {
      id: record._id,
      author: record.author,
      name: record.name,
      date: record.date,
      outcome: record.outcome
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
    foreigns: Foriegn[]
  ): Promise<void> {
    try {
      if (foreigns)
        for (let foreign of foreigns) {
          let data = foreign.data;
          // get id's to check, as an array
          let keys = record[foreign.name];
          if (!(keys instanceof Array)) keys = [keys];
          // fetch foreign document and reject if it doesn't exist
          for (let key of keys) {
            let collection = COLLECTIONS_MAP.get(data.target);
            let count = await this.db
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
                  ' collection'
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
    item: string
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      let record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Registration failed: no owner ' +
            owner +
            'found in ' +
            collection.name
        );
      // NOTE: below line is no good because schemaFor(outcomes) is arbitrary
      // let mapping = await this.db.collection(foreignData(schemaFor(collection), registry).target).findOne({ _id: item });
      // TODO: switch register and unregister and probably all thse to use schema instead of collection, so the next line works
      // let mapping = await this.db.collection(foreignData(schema, registry).target).findOne({ _id: item });
      // if (!mapping) return Promise.reject('Registration failed: no mapping ' + mapping + 'found in ' + collection);

      let pushdoc = {};
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
          e
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
    item: string
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      let record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Unregistration failed: no record ' + owner + 'found in ' + collection
        );
      if (!record[registry].includes(item)) {
        return Promise.reject(
          'Unregistration failed: record ' +
            owner +
            "'s " +
            registry +
            ' field has no element ' +
            item
        );
      }

      let pulldoc = {};
      pulldoc[registry] = item;

      await this.db
        .collection(collection.name)
        .updateOne({ _id: owner }, { $pull: pulldoc });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem unregistering from a ' +
          collection.name +
          ' ' +
          registry +
          ' field:\n\t' +
          e
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
    index: number
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      let record = await this.db
        .collection(collection.name)
        .findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Reorder failed: no record ' + owner + 'found in ' + collection.name
        );
      if (!record[registry].includes(item)) {
        return Promise.reject(
          'Reorder failed: record ' +
            owner +
            "'s " +
            registry +
            ' field has no element ' +
            item
        );
      }
      if (index < 0)
        return Promise.reject('Reorder failed: index cannot be negative');
      if (index >= record[registry].length) {
        return Promise.reject(
          'Reorder failed: index exceeds length of ' + registry + ' field'
        );
      }

      // perform the necessary operations
      await this.unregister(collection, owner, registry, item);

      let pushdoc = {};
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
      let foreigns = collection.foreigns;
      if (foreigns) {
        // check validity of all foreign keys
        await this.validateForeignKeys(record, foreigns);
      }

      // perform the actual insert
      let insert_ = await this.db.collection(collection.name).insertOne(record);
      let id = insert_.insertedId;

      // register the new record as needed
      if (foreigns)
        for (let foreign of foreigns) {
          let data = foreign.data;
          if (!data.child && data.registry) {
            let collection = COLLECTIONS_MAP.get(data.target);
            await this.register(
              collection,
              record[foreign.name],
              data.registry,
              `${id}`
            );
          }
        }
      return Promise.resolve(`${id}`);
    } catch (e) {
      return Promise.reject(
        'Problem inserting a ' + collection.name + ':\n\t' + e
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
    record: T
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
        'Problem editing a ' + collection.name + ':\n\t' + e
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
      // fetch data to be deleted ... for the last time :(
      let record = await this.db
        .collection(collection.name)
        .findOne<T>({ _id: id });

      // remove all children recursively, and unregister from parents
      let foreigns = collection.foreigns;
      if (foreigns)
        for (let foreign of foreigns) {
          let data = foreign.data;

          if (data.child) {
            // get children to remove, as an array
            let keys = record[foreign.name];
            if (!(keys instanceof Array)) keys = [keys];
            // remove each child
            for (let key of keys) {
              let collection = COLLECTIONS_MAP.get(data.target);
              await this.remove(collection, key);
            }
          }

          if (!data.child && data.registry) {
            // get registries to edit, as an array
            let keys = record[foreign.name];
            if (!(keys instanceof Array)) keys = [keys];
            // unregister from each key
            for (let key of keys) {
              let collection = COLLECTIONS_MAP.get(data.target);
              await this.unregister(collection, key, data.registry, id);
            }
          }
        }

      // perform actual deletion
      await this.db.collection(collection.name).deleteOne({ _id: id });

      return Promise.resolve();
    } catch (e) {
      return Promise.reject('Problem deleting a ' + collection + ':\n\t' + e);
    }
  }

  /**
   * Fetch a database record by its id.
   * @param {Function} schema provides collection information
   * @param {string} id the document to fetch
   */
  private async fetch<T>(collection: Collection, id: string): Promise<T> {
    let record = await this.db
      .collection(collection.name)
      .findOne<T>({ _id: id });
    if (!record)
      return Promise.reject(
        'Problem fetching a ' +
          collection.name +
          ':\n\tInvalid database id ' +
          JSON.stringify(id)
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
