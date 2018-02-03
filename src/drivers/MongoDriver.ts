import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';

import {
    autosFor,
    fixedsFor,
    foreignsFor,
    collections,
    collectionFor,
    schemaFor,
    foreignData,
    Record, Update, Insert, Edit,
    RecordID, UserID, LearningObjectID, OutcomeID,
    LearningOutcomeID, StandardOutcomeID,
    UserSchema, UserRecord, UserUpdate, UserInsert, UserEdit,
    LearningObjectSchema, LearningObjectRecord, LearningObjectUpdate,
    LearningObjectInsert, LearningObjectEdit,
    LearningOutcomeSchema, LearningOutcomeRecord, LearningOutcomeUpdate,
    LearningOutcomeInsert, LearningOutcomeEdit,
    StandardOutcomeSchema, StandardOutcomeRecord, StandardOutcomeUpdate,
    StandardOutcomeInsert, StandardOutcomeEdit,
    OutcomeRecord
} from '@cyber4all/clark-schema';

export { ObjectID as DBID };
import { DataStore } from "../interfaces/interfaces";
require('../useme');
import * as dotenv from 'dotenv';
dotenv.config();

export class MongoDriver implements DataStore {

    private db: Db;

    constructor() {
        let dburi = process.env.NODE_ENV === 'production' ?
            process.env.CLARK_DB_URI.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD).replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT).replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME)
            : process.env.CLARK_DB_URI_DEV.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD).replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT).replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
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
    async connect(dburistring: string): Promise<void> {
        try {
            this.db = await MongoClient.connect(dburistring);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem connecting to database at ' + dburistring + ':\n\t' + e);
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
     * Insert a user into the database.
     * @async
     *
     * @param {UserInsert} record
     *
     * @returns {UserID} the database id of the new record
     */
    async insertUser(record: UserInsert): Promise<boolean | ObjectID> {
        try {
            let doc = await this.db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ email: record.email });
            if (doc) return Promise.reject({ error: 'Email is already in use.' });
            record['_id'] = (new ObjectID()).toHexString();
            return this.insert(UserSchema, record);
        } catch (e) {
            return Promise.reject(e);
        }
    }
    /**
   * Insert a learning object into the database.
   * @async
   *
   * @param {LearningObjectInsert} record
   *
   * @returns {LearningObjectID} the database id of the new record
   */
    async insertLearningObject(record: LearningObjectInsert): Promise<LearningObjectID> {
        record['_id'] = (new ObjectID()).toHexString();
        return this.insert(LearningObjectSchema, record);
    }

    /**
     * Insert a learning outcome into the database.
     * @async
     *
     * @param {LearningOutcomeInsert} record
     *
     * @returns {LearningOutcomeID} the database id of the new record
     */
    async insertLearningOutcome(record: LearningOutcomeInsert): Promise<LearningOutcomeID> {
        try {
            console.log(record);
            record['_id'] = (new ObjectID()).toHexString();
            /* FIXME: In order to create auto-generated fields, we need to
                      query information for the foreign keys. But when we
                      perform the generic insert, we unnecessarily query
                      again to verify the foreign keys exist. Thoughts? */
            let source = await this.db.collection(collectionFor(LearningObjectSchema))
                .findOne<LearningObjectRecord>({ _id: record.source });
            console.log(source);
            let author = await this.db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ _id: source.authorID });
            record['author'] = author.name_;
            record['name_'] = source.name_;
            record['date'] = source.date;
            record['outcome'] = record.verb + ' ' + record.text;
            return this.insert(LearningOutcomeSchema, record);
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
    async insertStandardOutcome(record: StandardOutcomeInsert): Promise<StandardOutcomeID> {
        record['_id'] = (new ObjectID()).toHexString();
        record['source'] = record.author;
        record['tag'] = [record.date, record.name_, record.outcome].join('$');
        return this.insert(StandardOutcomeSchema, record);
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
    async mapOutcome(outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void> {
        /*
         * TODO: alter register (and others) to take schema, not collection
         *       perform validation in register (code is already written in comment down there)
         */
        // validate mapping, since it can't (currently) happen in generic register function
        // NOTE: this is a temporary fix. Do TODO above!
        let target = await this.db.collection('outcomes').findOne({ _id: mapping });
        if (!target) return Promise.reject('Registration failed: no mapping ' + mapping + 'found in outcomes');
        return this.register(collectionFor(LearningOutcomeSchema), outcome, 'mappings', mapping);
    }

    /**
     * Undo a mapping for an outcome.
     * @async
     *
     * @param {OutcomeID} outcome the user's outcome
     * @param {OutcomeID} mapping the newly associated outcome's id
     */
    async unmapOutcome(outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void> {
        return this.unregister(collectionFor(LearningOutcomeSchema), outcome, 'mappings', mapping);
    }

    /**
     * Reorder an outcome in an object's outcomes list.
     * @async
     *
     * @param {LearningObjectID} object the object
     * @param {LearningOutcomeID} outcome the outcome being reordered
     * @param {number} index the new index for the outcome
     */
    async reorderOutcome(object: LearningObjectID, outcome: LearningOutcomeID, index: number): Promise<void> {
        return this.reorder(collectionFor(LearningObjectSchema), object, 'outcomes', outcome, index);
    }

    ///////////////////////////////////////////////////////////////////
    // EDITS - update without touching any foreign keys or documents //
    ///////////////////////////////////////////////////////////////////

    /**
     * Edit a user.
     * @async
     *
     * @param {UserID} id which document to change
     * @param {UserEdit} record the values to change to
     */
    async editUser(id: UserID, record: UserEdit): Promise<void> {
        try {
            // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
            await this.edit(UserSchema, id, record);

            // ensure all outcomes have the right author tag
            let doc = await this.db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ _id: id });

            for (let objectid of doc.objects) {
                await this.db.collection(collectionFor(LearningOutcomeSchema))
                    .updateMany(
                    { source: objectid },
                    { $set: { author: record.name_ } },
                );
            }

            // perform the actual edit
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Edit a learning object.
     * @async
     *
     * @param {LearningObjectID} id which document to change
     * @param {LearningObjectEdit} record the values to change to
     */
    async editLearningObject(id: LearningObjectID, record: LearningObjectEdit): Promise<void> {
        try {
            // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
            await this.edit(LearningObjectSchema, id, record);

            // ensure all outcomes have the right name_ and date tag
            await this.db.collection(collectionFor(LearningOutcomeSchema))
                .updateMany(
                { source: id },
                {
                    $set: {
                        name_: record.name_,
                        date: record.date,
                    },
                },
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
    async editLearningOutcome(id: LearningOutcomeID, record: LearningOutcomeEdit): Promise<void> {
        record['outcome'] = record.verb + ' ' + record.text;
        return this.edit(LearningOutcomeSchema, id, record);
    }

    //////////////////////////////////////////
    // DELETIONS - will cascade to children //
    //////////////////////////////////////////

    /**
     * Remove a user (and its objects) from the database.
     * @async
     *
     * @param {UserID} id which document to delete
     */
    async deleteUser(id: UserID): Promise<void> {
        return this.remove(UserSchema, id);
    }

    /**
     * Remove a learning object (and its outcomes) from the database.
     * @async
     *
     * @param {LearningObjectID} id which document to delete
     */
    async deleteLearningObject(id: LearningObjectID): Promise<void> {
        return this.remove(LearningObjectSchema, id);
    }

    /**
    * Remove a learning object (and its outcomes) from the database.
    * @async
    *
    * @param {LearningObjectID} id which document to delete
    */
    async deleteMultipleLearningObjects(ids: LearningObjectID[]): Promise<any> {
        return Promise.all(ids.map((id) => {
            return this.remove(LearningObjectSchema, id);
        }));
    }

    /**
     * Remove a learning outcome from the database.
     * @async
     *
     * @param {LearningOutcomeID} id which document to delete
     */
    async deleteLearningOutcome(id: LearningOutcomeID): Promise<void> {
        try {
            // find any outcomes mapping to this one, and unmap them
            //  this data assurance step is in the general category of
            //  'any other foreign keys pointing to this collection and id'
            //  which is excessive enough to justify this specific solution
            await this.db.collection(collectionFor(LearningOutcomeSchema)).updateMany(
                { mappings: id },
                { $pull: { $mappings: id } },
            );
            // remove this outcome
            return this.remove(LearningOutcomeSchema, id);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    ///////////////////////////
    // INFORMATION RETRIEVAL //
    ///////////////////////////

    /**
     * Check if an email is registered to a user in the database.
     *
     * @param {string} email the user's email
     *
     * @returns {boolean} true iff userid/pwd pair is valid
     */
    async emailRegistered(email: string): Promise<boolean> {
        try {
            let doc = await this.db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ email: email });
            if (!doc) return Promise.resolve(false);
            return Promise.resolve(true);
        } catch (e) {
            return Promise.reject(e);
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
    async findUser(username: string): Promise<UserID> {
        try {
            let doc = await this.db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ username: username });
            if (!doc) return Promise.reject('No user with username ' + username + ' exists.');
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
    async findLearningObject(username: string, name: string): Promise<LearningObjectID> {
        try {
            let authorID = await this.findUser(username);
            let doc = await this.db.collection(collectionFor(LearningObjectSchema))
                .findOne<LearningObjectRecord>({
                    authorID: authorID,
                    name_: name,
                });
            if (!doc) return Promise.reject('No learning object \'' + name + '\' for the given user');
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
    async findLearningOutcome(source: LearningObjectID, tag: number): Promise<LearningOutcomeID> {
        try {
            let doc = await this.db.collection(collectionFor(LearningOutcomeSchema))
                .findOne<LearningOutcomeRecord>({
                    source: source,
                    tag: tag,
                });
            if (!doc) return Promise.reject('No learning outcome \'' + tag + '\' for the given learning object');
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
    async findMappingID(date: string, name: string, outcome: string): Promise<StandardOutcomeID> {
        try {
            let tag = date + '$' + name + '$' + outcome;
            let doc = await this.db.collection(collectionFor(StandardOutcomeSchema))
                .findOne<StandardOutcomeRecord>({
                    tag: tag,
                });
            if (!doc) return Promise.reject('No mappings found with tag: \'' + tag + '\' in the database');
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
    async fetchUser(id: UserID): Promise<UserRecord> {
        return this.fetch<UserRecord>(UserSchema, id);
    }


    /**
     * Fetch the learning object document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {LearningObjectRecord}
     */
    async fetchLearningObject(id: UserID): Promise<LearningObjectRecord> {
        return this.fetch<LearningObjectRecord>(LearningObjectSchema, id);
    }

    /**
     * Fetch the learning outcome document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {LearningOutcomeRecord}
     */
    async fetchLearningOutcome(id: UserID): Promise<LearningOutcomeRecord> {
        return this.fetch<LearningOutcomeRecord>(LearningOutcomeSchema, id);
    }

    /**
     * Fetch the generic outcome document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {OutcomeRecord}
     */
    async fetchOutcome(id: UserID): Promise<OutcomeRecord> {
        return this.fetch<OutcomeRecord>(LearningOutcomeSchema, id);
    }

    /**
    * Return literally all objects. Very expensive.
    * @returns {Cursor<LearningObjectRecord>[]} cursor of literally all objects
    */
    fetchAllObjects(currPage?: number, limit?: number): Promise<LearningObjectRecord[]> {
        let skip = currPage && limit ? ((currPage - 1) * limit) : undefined;
        return skip ?
            this.db.collection(collectionFor(LearningObjectSchema))
                .find<LearningObjectRecord>().skip(skip).limit(limit).toArray()
            : this.db.collection(collectionFor(LearningObjectSchema))
                .find<LearningObjectRecord>().toArray();
    }

    /**
     * Fetchs the learning object documents associated with the given ids.
     *
     * @param ids array of database ids
     *
     * @returns {Cursor<LearningObjectRecord>[]}
     */
    fetchMultipleObjects(ids: LearningObjectID[]): Promise<LearningObjectRecord[]> {
        return this.db.collection(collectionFor(LearningObjectSchema))
            .find<LearningObjectRecord>({ _id: { $in: ids } }).toArray();
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
        length: string,
        level: string,
        ascending: boolean,
        currPage?: number,
        limit?: number
    ): Promise<LearningObjectRecord[]> {
        let skip = currPage && limit ? ((currPage - 1) * limit) : undefined;
        try {
            let authorRecords: UserRecord[] = author ?
                await this.db.collection(collectionFor(UserSchema))
                    .find<UserRecord>({ name_: { $regex: new RegExp(author, 'ig') } }).toArray()
                : null;
            let authorIDs = authorRecords.length >= 0 ? authorRecords.map(doc => doc._id) : null;

            let objectCursor = await this.db.collection(collectionFor(LearningObjectSchema))
                .find<LearningObjectRecord>(
                {
                    authorID: authorIDs ? { $in: authorIDs } : { $regex: /./ig },
                    name_: { $regex: name ? new RegExp(name, 'ig') : /./ig },
                    length_: length ? length : { $regex: /./ig },
                    level: level ? level : { $regex: /./ig }
                }
                );
            objectCursor = skip ? objectCursor.skip(skip).limit(limit) : objectCursor;

            return objectCursor.toArray();
        } catch (e) {
            return Promise.reject('Error suggesting objects' + e);
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
    async validateForeignKeys(schema: Function, record: Record, foreigns: Set<string>): Promise<void> {
        try {
            if (foreigns) for (let foreign of foreigns) {
                let data = foreignData(schema, foreign);
                // get id's to check, as an array
                let keys = record[foreign];
                if (!(keys instanceof Array)) keys = [keys];
                // fetch foreign document and reject if it doesn't exist
                for (let key of keys) {
                    let count = await this.db.collection(data.target)
                        .count({ _id: key });
                    if (count === 0) {
                        return Promise.reject('Foreign key error for ' + record + ': '
                            + key + ' not in ' + data.target + ' collection');
                    }
                }
            }
            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem validating key constraint for a '
                + schema.name + ':\n\t' + e);
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
    async  register(collection: string, owner: RecordID, registry: string, item: RecordID): Promise<void> {
        try {
            // check validity of values before making any changes
            let record = await this.db.collection(collection).findOne({ _id: owner });
            if (!record) return Promise.reject('Registration failed: no owner ' + owner + 'found in ' + collection);
            // NOTE: below line is no good because schemaFor(outcomes) is arbitrary
            // let mapping = await this.db.collection(foreignData(schemaFor(collection), registry).target).findOne({ _id: item });
            // TODO: switch register and unregister and probably all thse to use schema instead of collection, so the next line works
            // let mapping = await this.db.collection(foreignData(schema, registry).target).findOne({ _id: item });
            // if (!mapping) return Promise.reject('Registration failed: no mapping ' + mapping + 'found in ' + collection);

            let pushdoc = {};
            pushdoc[registry] = item;

            await this.db.collection(collection).updateOne(
                { _id: owner },
                { $push: pushdoc },
            );
            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem registering to a ' + collections
                + ' ' + registry + ' field:\n\t' + e);
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
    async  unregister(collection: string, owner: RecordID, registry: string, item: RecordID): Promise<void> {
        try {
            // check validity of values before making any changes
            let record = await this.db.collection(collection).findOne({ _id: owner });
            if (!record) return Promise.reject('Unregistration failed: no record ' + owner + 'found in ' + collection);
            if (!record[registry].includes(item)) {
                return Promise.reject('Unregistration failed: record ' + owner + '\'s ' + registry + ' field has no element ' + item);
            }

            let pulldoc = {};
            pulldoc[registry] = item;

            await this.db.collection(collection).updateOne(
                { _id: owner },
                { $pull: pulldoc },
            );

            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem unregistering from a ' + collections
                + ' ' + registry + ' field:\n\t' + e);
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
    async  reorder(collection: string, owner: RecordID, registry: string, item: RecordID, index: number): Promise<void> {
        try {
            // check validity of values before making any changes
            let record = await this.db.collection(collection).findOne({ _id: owner });
            if (!record) return Promise.reject('Reorder failed: no record ' + owner + 'found in ' + collection);
            if (!record[registry].includes(item)) {
                return Promise.reject('Reorder failed: record ' + owner + '\'s ' + registry + ' field has no element ' + item);
            }
            if (index < 0) return Promise.reject('Reorder failed: index cannot be negative');
            if (index >= record[registry].length) {
                return Promise.reject('Reorder failed: index exceeds length of ' + registry + ' field');
            }

            // perform the necessary operations
            await this.unregister(collection, owner, registry, item);

            let pushdoc = {};
            pushdoc[registry] = {
                $each: [item],
                $position: index,
            };

            await this.db.collection(collection).updateOne(
                { _id: owner },
                { $push: pushdoc },
            );

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
    async  insert(schema: Function, record: Insert): Promise<RecordID> {
        try {
            let collection = collectionFor(schema);
            let foreigns = foreignsFor(schema);
            // FIXME: Find Difference Method and Remove any type casting
            if (foreigns) (<any>foreigns).difference(autosFor(schema));

            // check validity of all foreign keys
            await this.validateForeignKeys(schema, record, foreigns);

            // perform the actual insert
            let insert_ = await this.db.collection(collection).insertOne(record);
            let id = insert_.insertedId;

            // register the new record as needed
            if (foreigns) for (let foreign of foreigns) {
                let data = foreignData(schema, foreign);
                if (data.registry) {
                    await this.register(data.target, record[foreign], data.registry, id);
                }
            }
            return Promise.resolve(id);
        } catch (e) {
            return Promise.reject('Problem inserting a ' + schema.name + ':\n\t' + e);
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
    async update(schema: Function, id: RecordID, record: Update):
        Promise<void> {
        try {
            let collection = collectionFor(schema);
            let foreigns = foreignsFor(schema);
            // FIXME: Find Difference Method and Remove any type casting
            if (foreigns) foreigns = (<any>foreigns).difference(autosFor(schema))
                .difference(fixedsFor(schema));
            // check validity of all foreign keys
            await this.validateForeignKeys(schema, record, foreigns);

            // perform the actual update
            await this.db.collection(collection).updateOne({ _id: id }, { $set: record });

            // registered fields must be fixed, nothing to change here

            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem updating a ' + schema.name + ':\n\t' + e);
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
    async  edit(schema: Function, id: RecordID, record: Edit):
        Promise<void> {
        try {
            let collection = collectionFor(schema);

            // no foreign fields, no need to validate

            // perform the actual update
            await this.db.collection(collection).updateOne({ _id: id }, { $set: record });

            // registered fields must be fixed, nothing to change here

            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem editing a ' + schema.name + ':\n\t' + e);
        }
    }

    /**
     * Cascade delete a record and its children.
     * @async
     *
     * @param {Function} schema provides collection/hierarcy information
     * @param {RecordID} id the document to delete
     */
    async  remove(schema: Function, id: RecordID): Promise<void> {
        try {
            let collection = collectionFor(schema);

            // fetch data to be deleted ... for the last time :(
            let record = await this.db.collection(collection)
                .findOne<Record>({ _id: id });

            // remove all children recursively, and unregister from parents
            let foreigns = foreignsFor(schema);
            if (foreigns) for (let foreign of foreigns) {
                let data = foreignData(schema, foreign);

                if (data.child) {
                    // get children to remove, as an array
                    let keys = record[foreign];
                    if (!(keys instanceof Array)) keys = [keys];
                    // remove each child
                    for (let key of keys) {
                        await this.remove(schemaFor(data.target), key);
                    }
                }

                if (data.registry) {
                    // get registries to edit, as an array
                    let keys = record[foreign];
                    if (!(keys instanceof Array)) keys = [keys];
                    // unregister from each key
                    for (let key of keys) {
                        await this.unregister(data.target, key, data.registry, id);
                    }
                }
            }

            // perform actual deletion
            await this.db.collection(collection).deleteOne({ _id: id });

            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem deleting a ' + schema.name + ':\n\t' + e);
        }
    }

    /**
     * Fetch a database record by its id.
     * @param {Function} schema provides collection information
     * @param {RecordID} id the document to fetch
     */
    async  fetch<T>(schema: Function, id: RecordID): Promise<T> {
        let record = await this.db.collection(collectionFor(schema)).findOne<T>({ _id: id });
        if (!record) return Promise.reject('Problem fetching a ' + schema.name + ':\n\tInvalid database id ' + JSON.stringify(id));
        return Promise.resolve(record);
    }

}