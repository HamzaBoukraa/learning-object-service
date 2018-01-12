/**
 * Provide functions for consistent interaction with database
 * across all scripts and services.
 * Code adapted from agm1984 @
 * https://stackoverflow.com/questions/24621940/how-to-properly-reuse-connection-to-mongodb-across-nodejs-application-and-module
 */

// tslint:disable: no-string-literal

import { DBInterface } from '../interfaces/interfaces';

import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';

import {
    autosFor,
    fixedsFor,
    foreignsFor,
    fieldsFor,
    collections,
    collectionFor,
    schemaFor,
    foreignData,
} from '../schema/db.schema';
import {
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
    OutcomeRecord,
} from '../schema/schema';

export { ObjectID as DBID };

// only created once, no matter how many times the module is required
let _db: Db;

export class MongoDriver implements DBInterface {



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
    connect = async function (dburi: string): Promise<void> {
        try {
            _db = await MongoClient.connect(dburi);
            return Promise.resolve();
        } catch (e) {
            return Promise.reject('Problem connecting to database at ' + dburi + ':\n\t' + e);
        }
    };

    /**
     * Close the database. Note that this will affect all services
     * and scripts using the database, so only do this if it's very
     * important or if you are sure that *everything* is finished.
     */
    disconnect = function (): void {
        _db.close();
    };

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
    insertUser = async function (record: UserInsert): Promise<UserID> {
        record['_id'] = (new ObjectID()).toHexString();
        return insert(UserSchema, record);
    };

    /**
     * Insert a learning object into the database.
     * @async
     *
     * @param {LearningObjectInsert} record
     *
     * @returns {LearningObjectID} the database id of the new record
     */
    insertLearningObject = async function (record: LearningObjectInsert): Promise<LearningObjectID> {
        record['_id'] = (new ObjectID()).toHexString();
        return insert(LearningObjectSchema, record);
    };

    /**
     * Insert a learning outcome into the database.
     * @async
     *
     * @param {LearningOutcomeInsert} record
     *
     * @returns {LearningOutcomeID} the database id of the new record
     */
    insertLearningOutcome = async function (record: LearningOutcomeInsert): Promise<LearningOutcomeID> {
        try {
            record['_id'] = (new ObjectID()).toHexString();
            /* FIXME: In order to create auto-generated fields, we need to
                      query information for the foreign keys. But when we
                      perform the generic insert, we unnecessarily query
                      again to verify the foreign keys exist. Thoughts? */
            let source = await _db.collection(collectionFor(LearningObjectSchema))
                .findOne<LearningObjectRecord>({ _id: record.source });
            let author = await _db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ _id: source.author });
            record['author'] = author.name_;
            record['name_'] = source.name_;
            record['date'] = source.date;
            record['outcome'] = record.verb + ' ' + record.text;
            return insert(LearningOutcomeSchema, record);
        } catch (e) {
            return Promise.reject('Problem inserting a Learning Outcome:\n\t' + e);
        }
    };

    /**
     * Insert a standard outcome into the database.
     * @async
     *
     * @param {StandardOutcomeInsert} record
     *
     * @returns the database id of the new record
     */
    insertStandardOutcome = async function (record: StandardOutcomeInsert): Promise<StandardOutcomeID> {
        record['_id'] = (new ObjectID()).toHexString();
        record['source'] = record.author;
        record['tag'] = [record.date, record.name_, record.outcome].join('$');
        return insert(StandardOutcomeSchema, record);
    };

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
    mapOutcome = async function (outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void> {
        /*
         * TODO: alter register (and others) to take schema, not collection
         *       perform validation in register (code is already written in comment down there)
         */
        // validate mapping, since it can't (currently) happen in generic register function
        // NOTE: this is a temporary fix. Do TODO above!
        let target = await _db.collection('outcomes').findOne({ _id: mapping });
        if (!target) return Promise.reject('Registration failed: no mapping ' + mapping + 'found in outcomes');
        return register(collectionFor(LearningOutcomeSchema), outcome, 'mappings', mapping);
    };

    /**
     * Undo a mapping for an outcome.
     * @async
     *
     * @param {OutcomeID} outcome the user's outcome
     * @param {OutcomeID} mapping the newly associated outcome's id
     */
    unmapOutcome = async function (outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void> {
        return unregister(collectionFor(LearningOutcomeSchema), outcome, 'mappings', mapping);
    };

    /**
     * Reorder an object in a user's objects list.
     * @async
     *
     * @param {UserID} user the user
     * @param {LearningObjectID} object the object being reordered
     * @param {number} index the new index for the object
     */
    reorderObject = async function reorderObject(user: UserID, object: LearningObjectID, index: number): Promise<void> {
        return reorder(collectionFor(UserSchema), user, 'objects', object, index);
    };

    /**
     * Reorder an outcome in an object's outcomes list.
     * @async
     *
     * @param {LearningObjectID} object the object
     * @param {LearningOutcomeID} outcome the outcome being reordered
     * @param {number} index the new index for the outcome
     */
    reorderOutcome = async function (object: LearningObjectID, outcome: LearningOutcomeID, index: number): Promise<void> {
        return reorder(collectionFor(LearningObjectSchema), object, 'outcomes', outcome, index);
    };

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
    editUser = async function (id: UserID, record: UserEdit): Promise<void> {
        try {
            // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
            await edit(UserSchema, id, record);

            // ensure all outcomes have the right author tag
            let doc = await _db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ _id: id });

            for (let objectid of doc.objects) {
                await _db.collection(collectionFor(LearningOutcomeSchema))
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
    };

    /**
     * Edit a learning object.
     * @async
     *
     * @param {LearningObjectID} id which document to change
     * @param {LearningObjectEdit} record the values to change to
     */
    editLearningObject = async function (id: LearningObjectID, record: LearningObjectEdit): Promise<void> {
        try {
            // perform edit first, so uniqueness problems get caught BEFORE we edit outcomes
            await edit(LearningObjectSchema, id, record);

            // ensure all outcomes have the right name_ and date tag
            await _db.collection(collectionFor(LearningOutcomeSchema))
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
    };

    /**
     * Edit a learning outcome.
     * @async
     *
     * @param {LearningOutcomeID} id which document to change
     * @param {LearningOutcomeEdit} record the values to change to
     */
    editLearningOutcome = async function (id: LearningOutcomeID, record: LearningOutcomeEdit): Promise<void> {
        record['outcome'] = record.verb + ' ' + record.text;
        return edit(LearningOutcomeSchema, id, record);
    };

    //////////////////////////////////////////
    // DELETIONS - will cascade to children //
    //////////////////////////////////////////

    /**
     * Remove a user (and its objects) from the database.
     * @async
     *
     * @param {UserID} id which document to delete
     */
    deleteUser = async function (id: UserID): Promise<void> {
        return remove(UserSchema, id);
    };

    /**
     * Remove a learning object (and its outcomes) from the database.
     * @async
     *
     * @param {LearningObjectID} id which document to delete
     */
    deleteLearningObject = async function (id: LearningObjectID): Promise<void> {
        return remove(LearningObjectSchema, id);
    };

    /**
     * Remove a learning outcome from the database.
     * @async
     *
     * @param {LearningOutcomeID} id which document to delete
     */
    deleteLearningOutcome = async function (id: LearningOutcomeID): Promise<void> {
        try {
            // find any outcomes mapping to this one, and unmap them
            //  this data assurance step is in the general category of
            //  'any other foreign keys pointing to this collection and id'
            //  which is excessive enough to justify this specific solution
            await _db.collection(collectionFor(LearningOutcomeSchema)).updateMany(
                { mappings: id },
                { $pull: { $mappings: id } },
            );
            // remove this outcome
            return remove(LearningOutcomeSchema, id);
        } catch (e) {
            return Promise.reject(e);
        }
    };

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
    emailRegistered = async function (email: string): Promise<boolean> {
        try {
            let doc = await _db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ email: email });
            if (!doc) return Promise.resolve(false);
            return Promise.resolve(true);
        } catch (e) {
            return Promise.reject(e);
        }
    };

    /**
     * Look up a user by its login id.
     * @async
     *
     * @param {string} id the user's login id
     *
     * @returns {UserID}
     */
    findUser = async function (id: string): Promise<UserID> {
        try {
            let doc = await _db.collection(collectionFor(UserSchema))
                .findOne<UserRecord>({ id: id });
            if (!doc) return Promise.reject('No user with id ' + id + ' exists.');
            return Promise.resolve(doc._id);
        } catch (e) {
            return Promise.reject(e);
        }
    };

    /**
     * Look up a learning object by its author and name.
     * @async
     *
     * @param {UserID} author the author's unique database id
     * @param {string} name the object's name
     *
     * @returns {LearningObjectID}
     */
    findLearningObject = async function (author: UserID, name: string): Promise<LearningObjectID> {
        try {
            let doc = await _db.collection(collectionFor(LearningObjectSchema))
                .findOne<LearningObjectRecord>({
                    author: author,
                    name_: name,
                });
            if (!doc) return Promise.reject('No learning object \'' + name + '\' for the given user');
            return Promise.resolve(doc._id);
        } catch (e) {
            return Promise.reject(e);
        }
    };

    /**
     * Look up a learning outcome by its source and tag.
     * @async
     *
     * @param {LearningObjectID} source the object source's unique database id
     * @param {number} tag the outcome's unique identifier
     *
     * @returns {LearningOutcomeID}
     */
    findLearningOutcome = async function (source: LearningObjectID, tag: number): Promise<LearningOutcomeID> {
        try {
            let doc = await _db.collection(collectionFor(LearningOutcomeSchema))
                .findOne<LearningOutcomeRecord>({
                    source: source,
                    tag: tag,
                });
            if (!doc) return Promise.reject('No learning outcome \'' + tag + '\' for the given learning object');
            return Promise.resolve(doc._id);
        } catch (e) {
            return Promise.reject(e);
        }
    };

    /**
     * Fetch the user document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {UserRecord}
     */
    fetchUser = async function (id: UserID): Promise<UserRecord> {
        return fetch<UserRecord>(UserSchema, id);
    };


    /**
     * Fetch the learning object document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {LearningObjectRecord}
     */
    fetchLearningObject = async function (id: UserID): Promise<LearningObjectRecord> {
        return fetch<LearningObjectRecord>(LearningObjectSchema, id);
    };

    /**
     * Fetch the learning outcome document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {LearningOutcomeRecord}
     */
    fetchLearningOutcome = async function (id: UserID): Promise<LearningOutcomeRecord> {
        return fetch<LearningOutcomeRecord>(LearningOutcomeSchema, id);
    };

    /**
     * Fetch the generic outcome document associated with the given id.
     * @async
     *
     * @param id database id
     *
     * @returns {OutcomeRecord}
     */
    fetchOutcome = async function (id: UserID): Promise<OutcomeRecord> {
        return fetch<OutcomeRecord>(LearningOutcomeSchema, id);
    };

    /////////////////
    // TEXT SEARCH //
    /////////////////

    /**
     * Return literally all objects. Very expensive.
     * @returns {Cursor<LearningObjectRecord[]} cursor of literally all objects
     */
    fetchAllObjects = function (): Cursor<LearningObjectRecord> {
        return _db.collection(collectionFor(LearningObjectSchema))
            .find<LearningObjectRecord>();
    };

    /**
     * Search for objects on CuBE criteria.
     *
     * TODO: Efficiency very questionable. Needs improvement. Error handling also bad.
     */
    searchObjects = async function (
        name: string,
        author: string,
        length: string,
        level: string,
        content: string,
    ): Promise<LearningObjectRecord[]> {
        try {
            let all: LearningObjectRecord[] = await this.fetchAllObjects().toArray();
            let results: LearningObjectRecord[] = [];
            for (let object of all) {
                if (name && object.name_ !== name) continue;
                if (author) {
                    let record = await _db.collection(collectionFor(UserSchema))
                        .findOne<UserRecord>({ _id: object.author });
                    if (record.name_ !== author) continue;
                }
                if (length && object.length_ !== length) continue;
                /**
                 * TODO: implement level
                 */
                if (content) {
                    let tokens = content.split(/\s/);
                    let docs: any[] = [];
                    for (let token of tokens) {
                        docs.push({ outcome: { $regex: token } });
                    }
                    let count = await _db.collection(collectionFor(StandardOutcomeSchema))
                        .count({
                            _id: object._id,
                            $and: docs,
                        });
                    if (count === 0) continue;
                }
                results.push(object);
            }
            return Promise.resolve(results);
        } catch (e) {
            return Promise.reject(e);
        }
    };

    /**
     * Find outcomes matching a text query.
     * This variant uses Mongo's fancy text query. Questionable results.
     * NOTE: this function also projects a score onto the cursor documents
     *
     * @param {string} text the words to search for
     *
     * @returns {Cursor<OutcomeRecord>} cursor of positive matches
     */
    searchOutcomes = function (text: string): Cursor<OutcomeRecord> {
        return _db.collection(collectionFor(StandardOutcomeSchema))
            .find<OutcomeRecord>(
            { $text: { $search: text } },
            { score: { $meta: 'textScore' } });
    };

    /**
     * Find outcomes matching a text query.
     * This variant finds all outcomes containing every word in the query.
     * @param {string} text the words to match against
     *
     * @returns {Cursor<OutcomeRecord>} cursor of positive matches
     */
    matchOutcomes = function (text: string): Cursor<OutcomeRecord> {
        let tokens = text.split(/\s/);
        let docs: any[] = [];
        for (let token of tokens) {
            docs.push({ outcome: { $regex: token } });
        }

        // score property is not projected, will be undefined in documents
        return _db.collection(collectionFor(StandardOutcomeSchema))
            .find<OutcomeRecord>({
                $and: docs,
            });
    };
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
async function validateForeignKeys(schema: Function, record: Record, foreigns: Set<string>): Promise<void> {
    try {
        if (foreigns) for (let foreign of foreigns) {
            let data = foreignData(schema, foreign);
            // get id's to check, as an array
            let keys = record[foreign];
            if (!(keys instanceof Array)) keys = [keys];
            // fetch foreign document and reject if it doesn't exist
            for (let key of keys) {
                let count = await _db.collection(data.target)
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
async function register(collection: string, owner: RecordID, registry: string, item: RecordID): Promise<void> {
    try {
        // check validity of values before making any changes
        let record = await _db.collection(collection).findOne({ _id: owner });
        if (!record) return Promise.reject('Registration failed: no owner ' + owner + 'found in ' + collection);
        // NOTE: below line is no good because schemaFor(outcomes) is arbitrary
        // let mapping = await _db.collection(foreignData(schemaFor(collection), registry).target).findOne({ _id: item });
        // TODO: switch register and unregister and probably all thse to use schema instead of collection, so the next line works
        // let mapping = await _db.collection(foreignData(schema, registry).target).findOne({ _id: item });
        // if (!mapping) return Promise.reject('Registration failed: no mapping ' + mapping + 'found in ' + collection);

        let pushdoc = {};
        pushdoc[registry] = item;

        await _db.collection(collection).updateOne(
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
async function unregister(collection: string, owner: RecordID, registry: string, item: RecordID): Promise<void> {
    try {
        // check validity of values before making any changes
        let record = await _db.collection(collection).findOne({ _id: owner });
        if (!record) return Promise.reject('Unregistration failed: no record ' + owner + 'found in ' + collection);
        if (!record[registry].includes(item)) {
            return Promise.reject('Unregistration failed: record ' + owner + '\'s ' + registry + ' field has no element ' + item);
        }

        let pulldoc = {};
        pulldoc[registry] = item;

        await _db.collection(collection).updateOne(
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
async function reorder(collection: string, owner: RecordID, registry: string, item: RecordID, index: number): Promise<void> {
    try {
        // check validity of values before making any changes
        let record = await _db.collection(collection).findOne({ _id: owner });
        if (!record) return Promise.reject('Reorder failed: no record ' + owner + 'found in ' + collection);
        if (!record[registry].includes(item)) {
            return Promise.reject('Reorder failed: record ' + owner + '\'s ' + registry + ' field has no element ' + item);
        }
        if (index < 0) return Promise.reject('Reorder failed: index cannot be negative');
        if (index >= record[registry].length) {
            return Promise.reject('Reorder failed: index exceeds length of ' + registry + ' field');
        }

        // perform the necessary operations
        await unregister(collection, owner, registry, item);

        let pushdoc = {};
        pushdoc[registry] = {
            $each: [item],
            $position: index,
        };

        await _db.collection(collection).updateOne(
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
async function insert(schema: Function, record: Insert): Promise<RecordID> {
    try {
        let collection = collectionFor(schema);
        let foreigns = foreignsFor(schema);
        if (foreigns) foreigns.difference(autosFor(schema));

        // check validity of all foreign keys
        await validateForeignKeys(schema, record, foreigns);

        // perform the actual insert
        let insert_ = await _db.collection(collection).insertOne(record);
        let id = insert_.insertedId;

        // register the new record as needed
        if (foreigns) for (let foreign of foreigns) {
            let data = foreignData(schema, foreign);
            if (data.registry) {
                await register(data.target, record[foreign], data.registry, id);
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
async function update(schema: Function, id: RecordID, record: Update):
    Promise<void> {
    try {
        let collection = collectionFor(schema);
        let foreigns = foreignsFor(schema);
        if (foreigns) foreigns = foreigns.difference(autosFor(schema))
            .difference(fixedsFor(schema));
        // check validity of all foreign keys
        await validateForeignKeys(schema, record, foreigns);

        // perform the actual update
        await _db.collection(collection).updateOne({ _id: id }, { $set: record });

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
async function edit(schema: Function, id: RecordID, record: Edit):
    Promise<void> {
    try {
        let collection = collectionFor(schema);

        // no foreign fields, no need to validate

        // perform the actual update
        await _db.collection(collection).updateOne({ _id: id }, { $set: record });

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
async function remove(schema: Function, id: RecordID): Promise<void> {
    try {
        let collection = collectionFor(schema);

        // fetch data to be deleted ... for the last time :(
        let record = await _db.collection(collection)
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
                    await remove(schemaFor(data.target), key);
                }
            }

            if (data.registry) {
                // get registries to edit, as an array
                let keys = record[foreign];
                if (!(keys instanceof Array)) keys = [keys];
                // unregister from each key
                for (let key of keys) {
                    await unregister(data.target, key, data.registry, id);
                }
            }
        }

        // perform actual deletion
        await _db.collection(collection).deleteOne({ _id: id });

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
async function fetch<T>(schema: Function, id: RecordID): Promise<T> {
    let record = await _db.collection(collectionFor(schema)).findOne<T>({ _id: id });
    if (!record) return Promise.reject('Problem fetching a ' + schema.name + ':\n\tInvalid database id ' + JSON.stringify(id));
    return Promise.resolve(record);
}
