import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';
import { DataStore } from '../interfaces/interfaces';
import * as dotenv from 'dotenv';
import { LearningObject, LearningOutcome, StandardOutcome, User } from '@cyber4all/clark-entity';
import { LearningObjectDocument, LearningOutcomeDocument, UserDocument, StandardOutcomeDocument } from '@cyber4all/clark-schema';
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
  target: Collection;
  child: boolean;
  registry?: string;
}
export class COLLECTIONS {
  public static User: Collection = {
    name: 'users', foreigns: [
      {
        name: 'objects',
        data: {
          target: LearningObject,
          child: true,
        }
      }], uniques: ['username']
  };
  public static LearningObject: Collection = { name: 'objects' };
  public static LearningOutcome: Collection = { name: 'learning-outcomes' };
  public static StandardOutcome: Collection = { name: 'outcomes' };
  public static LearningObjectCollection: Collection = { name: 'collections' };
}


export class MongoDriver implements DataStore {
  private db: Db;

  constructor() {
    let dburi =
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
  async insertLearningObject(
    object: LearningObject
  ): Promise<string> {
    let doc: LearningObjectDocument;
    doc['_id'] = new ObjectID().toHexString();
    return this.insert(COLLECTIONS.LearningObject, doc);
  }

  /**
   * Insert a learning outcome into the database.
   * @async
   *
   * @param {LearningOutcomeInsert} record
   *
   * @returns {LearningOutcomeID} the database id of the new record
   */
  async insertLearningOutcome(
    outcome: LearningOutcome
  ): Promise<string> {
    try {
      console.log(outcome);
      let doc: LearningOutcomeDocument;
      doc['_id'] = new ObjectID().toHexString();

      let source = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOne<LearningObjectDocument>({ _id: record.source });
      console.log(source);
      let author = await this.db
        .collection(COLLECTIONS.User.name)
        .findOne<UserDocument>({ _id: source.authorID });
      doc['author'] = author.name_;
      doc['name_'] = source.name_;
      doc['date'] = source.date;
      doc['outcome'] = outcome.verb + ' ' + outcome.text;
      return this.insert(COLLECTIONS.LearningOutcome, doc);
    } catch (e) {
      return Promise.reject('Problem inserting a Learning Outcome:\n\t' + e);
    }
  }

  /**
   * Insert a standard outcome into the database.
   * @async
   *
   * @param {StandardOutcomeInsert} record
   *
   * @returns the database id of the new record
   */
  async insertStandardOutcome(
    outcome: StandardOutcome
  ): Promise<string> {
    let doc: StandardOutcomeDocument;
    doc['_id'] = new ObjectID().toHexString();
    doc['source'] = outcome.author;
    doc['tag'] = [outcome.date, outcome.name, outcome.outcome].join('$');
    return this.insert(COLLECTIONS.StandardOutcome, doc);
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
  async mapOutcome(
    outcome: string,
    mapping: string
  ): Promise<void> {
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
  async unmapOutcome(
    outcome: string,
    mapping: string
  ): Promise<void> {
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
  async editLearningObject(
    id: string,
    object: LearningObject
  ): Promise<void> {
    try {
      let doc: LearningObjectDocument;
      // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
      await this.edit(COLLECTIONS.LearningObject, id, doc);

      // ensure all outcomes have the right name_ and date tag
      await this.db.collection(COLLECTIONS.LearningOutcome.name).updateMany(
        { source: id },
        {
          $set: {
            name_: object.name,
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
  async editLearningOutcome(
    id: string,
    outcome: LearningOutcome
  ): Promise<void> {
    let doc: LearningOutcomeDocument;
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
  async deleteLearningOutcome(id: string): Promise<void> {
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
   * Look up a user by its login id.
   * @async
   *
   * @param {string} id the user's login id
   *
   * @returns {UserID}
   */
  async findUser(username: string): Promise<string> {
    try {
      let doc = await this.db
        .collection(COLLECTIONS.User.name)
        .findOne<UserDocument>({ username: username });
      if (!doc)
        return Promise.reject('No user with username ' + username + ' exists.');
      return Promise.resolve(doc._id);
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
  async findLearningObject(
    username: string,
    name: string
  ): Promise<string> {
    try {
      let authorID = await this.findUser(username);
      let doc = await this.db
        .collection(COLLECTIONS.LearningObject.name)
        .findOne<LearningObjectDocument>({
          authorID: authorID,
          name_: name
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
  async findLearningOutcome(
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
    return this.fetch<UserDocument>(COLLECTIONS.User, id);
  }

  /**
   * Fetch the learning object document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {LearningObjectRecord}
   */
  async fetchLearningObject(id: string): Promise<LearningObject> {
    return this.fetch<LearningObjectDocument>(COLLECTIONS.LearningObject, id);
  }

  /**
   * Fetch the learning outcome document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {LearningOutcomeRecord}
   */
  async fetchLearningOutcome(id: string): Promise<LearningOutcome> {
    return this.fetch<LearningOutcomeDocument>(COLLECTIONS.LearningOutcome, id);
  }

  /**
   * Fetch the generic outcome document associated with the given id.
   * @async
   *
   * @param id database id
   *
   * @returns {OutcomeRecord}
   */
  async fetchOutcome(id: string): Promise<StandardOutcome> {
    return this.fetch<StandardOutcomeDocument>(COLLECTIONS.StandardOutcome, id);
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
        .find<LearningObjectDocument>();
      let totalRecords = await objectCursor.count();
      objectCursor =
        skip !== undefined
          ? objectCursor.skip(skip).limit(limit)
          : limit ? objectCursor.limit(limit) : objectCursor;
      let objects = await objectCursor.toArray();
      return Promise.resolve({
        objects: objects,
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
  fetchMultipleObjects(
    ids: string[]
  ): Promise<LearningObject[]> {
    return this.db
      .collection(COLLECTIONS.LearningObject.name)
      .find<LearningObjectDocument>({ _id: { $in: ids } })
      .toArray();
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
      let authorRecords: UserDocument[] =
        author || text
          ? await this.db
            .collection(COLLECTIONS.User.name)
            .find<UserDocument>({
              name_: {
                $regex: new RegExp(author ? author : text, 'ig')
              }
            })
            .toArray()
          : null;
      let authorIDs = authorRecords ? authorRecords.map(doc => doc._id) : null;

      let outcomeRecords: LearningOutcomeDocument[] = standardOutcomeIDs
        ? await this.db
          .collection(COLLECTIONS.LearningObject.name)
          .find<LearningOutcomeDocument>({
            mappings: { $all: standardOutcomeIDs }
          })
          .toArray()
        : null;
      let outcomeIDs = outcomeRecords
        ? outcomeRecords.map(doc => doc._id)
        : null;

      let objectCursor;
      if (text || text === '') {
        let textQuery = {
          $or: [
            { name_: { $regex: new RegExp(text, 'ig') } },
            {
              goals: {
                $elemMatch: { text: { $regex: new RegExp(text, 'ig') } }
              }
            }
          ]
        };

        authorIDs
          ? textQuery.$or.push(<any>{
            authorID: { $in: authorIDs }
          })
          : 'NOT MATCHING AUTHORS';

        length
          ? (textQuery['length_'] = { $in: length })
          : 'NOT MATCHING LENGTHS';

        level ? (textQuery['level'] = { $in: level }) : 'NOT MATCHING LEVELS';

        outcomeIDs
          ? (textQuery['outcomes'] =
            outcomeIDs.length > 0 ? { $in: outcomeIDs } : ['DONT MATCH ME'])
          : 'NOT MATCHINF OUTCOMES';

        objectCursor = await this.db
          .collection(COLLECTIONS.LearningObject.name)
          .find<LearningObjectDocument>(textQuery);
      } else {
        let fieldQuery = {};
        authorIDs
          ? (fieldQuery['authorID'] = { $in: authorIDs })
          : 'NOT MATCHING AUTHORS';
        name
          ? (fieldQuery['name_'] = { $regex: new RegExp(name, 'ig') })
          : 'NOT MATCHING LEARNING OBJECT NAME';
        length
          ? (fieldQuery['length_'] = { $in: length })
          : 'NOT MATCHING LENGTHS';
        level ? (fieldQuery['level'] = { $in: level }) : 'NOT MATCHING LEVELS';
        outcomeIDs
          ? (fieldQuery['outcomes'] = { $in: outcomeIDs })
          : 'NOT MATCHING OUTCOMES';

        objectCursor = await this.db
          .collection(COLLECTIONS.LearningObject.name)
          .find<LearningObjectDocument>(fieldQuery);
      }

      let totalRecords = await objectCursor.count();
      objectCursor =
        skip !== undefined
          ? objectCursor.skip(skip).limit(limit)
          : limit ? objectCursor.limit(limit) : objectCursor;

      objectCursor = orderBy
        ? objectCursor.sort(orderBy, sortType ? sortType : 1)
        : objectCursor;
      let objects = await objectCursor.toArray();

      return Promise.resolve({
        objects: objects,
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
      return collection;
    } catch (e) {
      return Promise.reject(e);
    }
  }

  ////////////////////////////////////////////////
  // GENERIC HELPER METHODS - not in public API //
  ////////////////////////////////////////////////

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
  async validateForeignKeys<T>(
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
            let count = await this.db
              .collection(data.target.name)
              .count({ _id: key });
            if (count === 0) {
              return Promise.reject(
                'Foreign key error for ' +
                record +
                ': ' +
                key +
                ' not in ' +
                data.target.name +
                ' collection'
              );
            }
          }
        }
      return Promise.resolve();
    } catch (e) {
      return Promise.reject(
        'Problem validating key constraint :\n\t' + e
      );
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
  async register(
    collection: Collection,
    owner: string,
    registry: string,
    item: string
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      let record = await this.db.collection(collection.name).findOne({ _id: owner });
      if (!record)
        return Promise.reject(
          'Registration failed: no owner ' + owner + 'found in ' + collection.name
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
  async unregister(
    collection: Collection,
    owner: string,
    registry: string,
    item: string
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      let record = await this.db.collection(collection.name).findOne({ _id: owner });
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
  async reorder(
    collection: Collection,
    owner: string,
    registry: string,
    item: string,
    index: number
  ): Promise<void> {
    try {
      // check validity of values before making any changes
      let record = await this.db.collection(collection.name).findOne({ _id: owner });
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
  async insert<T>(collection: Collection, record: T): Promise<string> {
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
          if (data.registry) {
            await this.register(
              data.target,
              record[foreign.name],
              data.registry,
              `${id}`
            );
          }
        }
      return Promise.resolve(`${id}`);
    } catch (e) {
      return Promise.reject('Problem inserting a ' + collection.name + ':\n\t' + e);
    }
  }

  /**
   * Update a generic item in the database.
   * @async
   *
   * @param {Function} schema provides collection/validation information
   * @param {RecordID} id which document to update
   * @param {Update} record the values to change to
   */
  async update<T>(collection: Collection, id: string, record: T): Promise<void> {
    try {
      let foreigns = collection.foreigns;
      if (foreigns) {
        // check validity of all foreign keys
        await this.validateForeignKeys(record, foreigns);
      }

      // perform the actual update
      await this.db
        .collection(collection.name)
        .updateOne({ _id: id }, { $set: record });

      // registered fields must be fixed, nothing to change here

      return Promise.resolve();
    } catch (e) {
      return Promise.reject('Problem updating a ' + collection.name + ':\n\t' + e);
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
  async edit<T>(collection: Collection, id: string, record: T): Promise<void> {
    try {

      // no foreign fields, no need to validate

      // perform the actual update
      await this.db
        .collection(collection.name)
        .updateOne({ _id: id }, { $set: record });

      // registered fields must be fixed, nothing to change here

      return Promise.resolve();
    } catch (e) {
      return Promise.reject('Problem editing a ' + collection.name + ':\n\t' + e);
    }
  }

  /**
   * Cascade delete a record and its children.
   * @async
   *
   * @param {COLLECTIONS} collection provides collection information
   * @param {string} id the document to delete
   */
  async remove<T>(collection: Collection, id: string): Promise<void> {
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
              await this.remove(data.target, key);
            }
          }

          if (data.registry) {
            // get registries to edit, as an array
            let keys = record[foreign.name];
            if (!(keys instanceof Array)) keys = [keys];
            // unregister from each key
            for (let key of keys) {
              await this.unregister(data.target, key, data.registry, id);
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
  async fetch<T>(collection: Collection, id: string): Promise<T> {
    let record = await this.db
      .collection(collection.name)
      .findOne<T>({ _id: id });
    if (!record)
      return Promise.reject(
        'Problem fetching a ' +
        collection +
        ':\n\tInvalid database id ' +
        JSON.stringify(id)
      );
    return Promise.resolve(record);
  }
}
