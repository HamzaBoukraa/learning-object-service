// module providing consistent interaction with database across all our services
// code closely adapted from agm1984 @ https://stackoverflow.com/questions/24621940/how-to-properly-reuse-connection-to-mongodb-across-nodejs-application-and-module

import { MongoClient, Db, Cursor, ObjectID } from 'mongodb';

import { RecordID, UserID, LearningObjectID, OutcomeID, LearningOutcomeID, StandardOutcomeID } from './db.schema';
import { Record, Update, Insert, Edit } from './db.schema';
import { collections, collectionFor, schemaFor, foreignData } from './db.schema';
import { autosFor, fixedsFor, foreignsFor, fieldsFor } from './db.schema';

import { UserSchema, UserRecord, UserUpdate, UserInsert, UserEdit } from './user.schema';
import { LearningObjectSchema, LearningObjectRecord, LearningObjectUpdate, LearningObjectInsert, LearningObjectEdit } from './learning-object.schema';
import { LearningOutcomeSchema, LearningOutcomeRecord, LearningOutcomeUpdate, LearningOutcomeInsert, LearningOutcomeEdit } from './learning-outcome.schema';
import { StandardOutcomeSchema, StandardOutcomeRecord, StandardOutcomeUpdate, StandardOutcomeInsert, StandardOutcomeEdit } from './standard-outcome.schema';
import { OutcomeRecord } from './learning-outcome.schema';

export { ObjectID };
export const uri = "mongodb://localhost:27017/onion";

let _db: Db;    // only created once, no matter how many times the module is required (or so I'm told)

// each service should call this and do everything within the resolution
//  TODO: test what happens when more than one service calls this
export async function connect(): Promise<void> {
    try {
        _db = await MongoClient.connect(uri);
        return Promise.resolve();
    } catch(e) {
        return Promise.reject("Problem connecting to database at "+uri+":\n\t"+e);
    }
}

export function disconnect(): void {
    _db.close();
}

// inserts

export async function insertUser(record: UserInsert): Promise<UserID> {
    return insert(UserSchema, record);
}

export async function insertLearningObject(record: LearningObjectInsert): Promise<LearningObjectID> {
    return insert(LearningObjectSchema, record);
}

export async function insertLearningOutcome(record: LearningOutcomeInsert): Promise<LearningOutcomeID> {
    try {
        let source = await _db.collection(collectionFor(LearningObjectSchema)).findOne<LearningObjectRecord>({_id: record.source});
        let author = await _db.collection(collectionFor(UserSchema)).findOne<UserRecord>({_id:source.author});
        // technically the insertion process will unncecessarily re-find the above source in its validation
        // if we really want, we could try to add contraint information to the auto decorator,
        //  and use it in the generic insert function. I don't really think it's worth the effort...
        record['author'] = author.name_;
        record['name_'] = source.name_;
        return insert(LearningOutcomeSchema, record);
    } catch(e) {
        return Promise.reject("Problem inserting a Learning Outcome:\n\t"+e);
    }
}

export async function insertStandardOutcome(record: StandardOutcomeInsert): Promise<StandardOutcomeID> {
    return insert(StandardOutcomeSchema, record);
}

// mapping

export async function mapOutcome(outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void> {
    return register('outcomes', outcome, 'mappings', mapping);
}

export async function unmapOutcome(outcome: LearningOutcomeID, mapping: OutcomeID): Promise<void> {
    return unregister('outcomes', outcome, 'mappings', mapping);
}

// updates

export async function updateUser(id: UserID, record: UserUpdate): Promise<void> {
    return update(UserSchema, id, record);
}

export async function updateLearningObject(id: LearningObjectID, record: LearningObjectUpdate): Promise<void> {
    return update(LearningObjectSchema, id, record);
}

export async function LearningOutcomeUser(id: LearningOutcomeID, record: LearningOutcomeUpdate): Promise<void> {
    return update(LearningOutcomeSchema, id, record);
}

// edits

export async function editUser(id: UserID, record: UserEdit): Promise<void> {
    return edit(UserSchema, id, edit);
}

export async function editLearningObject(id: LearningObjectID, record: LearningObjectEdit): Promise<void> {
    return edit(LearningObjectSchema, id, edit);
}

export async function editLearningOutcome(id: LearningOutcomeID, record: LearningOutcomeEdit): Promise<void> {
    return edit(LearningOutcomeSchema, id, edit);
}

// deletions

export async function deleteUser(id: UserID): Promise<void> {
    return remove(UserSchema, id);
}

export async function deleteLearningObject(id: LearningObjectID): Promise<void> {
    return remove(LearningObjectSchema, id);
}

export async function deleteLearningOutcome(id: LearningOutcomeID): Promise<void> {
    return remove(LearningOutcomeSchema, id);
}

export function matchOutcomes(text: string): Cursor<ProjectedOutcomeRecord> {
    // TODO: no present reason to, but we may wish to generalize find functions below,
    //      as done with all the others
    return _db.collection(collectionFor(StandardOutcomeSchema)).find<ProjectedOutcomeRecord>(
        { $text: {$search: text} },
        { score: {$meta: "textScore"} })
        .sort( { score: {$meta: "textScore"} } ) ;
}

interface ProjectedOutcomeRecord extends OutcomeRecord {
    score: number
}




async function validateForeignKeys(schema: Function, record: Record, foreigns: Set<string>): Promise<void> {
    try {
        if(foreigns) for ( let foreign of foreigns ) {
            let data = foreignData(schema, foreign);
            // get id's to check, as an array
            let keys = record[foreign];
            if ( ! (keys instanceof Array) ) keys = [keys];
            // fetch document being pointed to, and reject if it doesn't exist
            for (let key of keys ) {
                let count = await _db.collection(data.target).count({_id: key});
                if(count == 0) return Promise.reject("Foreign key error for "+record+": "+key+" not in "+data.target+" collection");
            }
        }
        return Promise.resolve();
    } catch(e) {
        return Promise.reject("Problem validating key constraint for a "+schema.name+":\n\t"+e);
    }
}

async function register(collection: string, owner: RecordID, registry: string, item: RecordID): Promise<void> {
    try {
        let pushdoc = {};
        pushdoc[registry] = item;

        await _db.collection(collection).update({
            _id: owner
        }, {
            $push: pushdoc
        });
        return Promise.resolve();
    } catch(e) {
        return Promise.reject("Problem registering to a "+collections+" "+registry+" field:\n\t"+e);
    }
}

async function unregister(collection: string, owner: RecordID, registry: string, item: RecordID): Promise<void> {
    try {
        // fetch the document to unregister from
        let doc = await _db.collection(collection).findOne<Record>({_id: owner});

        // remove item from the registry
        let list = doc[registry];
        for ( let i = 0; i < list.length; i ++ ) {
            if (list[i] == item) {
                list.splice(i, 1);
                i --;   // keep going, just in case the item was somehow multiply registered
            }
        }

        let splicedoc = {};
        splicedoc[registry] = list;

        // update the registry
        await _db.collection(collection).updateOne({_id:owner}, splicedoc);

        return Promise.resolve();
    } catch(e) {
        return Promise.reject("Problem unregistering from a "+collections+" "+registry+" field:\n\t"+e);
    }
}

async function insert(schema: Function, record: Insert): Promise<RecordID> {
    try {
        let collection = collectionFor(schema);
        let foreigns = foreignsFor(schema)
        if(foreigns) foreigns.difference(autosFor(schema));

        // check validity of all foreign keys
        await validateForeignKeys(schema, record, foreigns);

        // perform the actual insert
        let insert = await _db.collection(collection).insertOne(record);
        let id = insert.insertedId;

        // register the new record as needed
        if(foreigns) for ( let foreign of foreigns ) {
            let data = foreignData(schema, foreign);
            if (data.registry) {
                await register(data.target, record[foreign], data.registry, id);
            }
        }

        return Promise.resolve(id);
    } catch(e) {
        return Promise.reject("Problem inserting a "+schema.name+":\n\t"+e);
    }
}

async function update(schema: Function, id: RecordID, record: Update): Promise<void> {
    try {
        let collection = collectionFor(schema);
        let foreigns = foreignsFor(schema);
        if(foreigns) foreigns = foreigns.difference(autosFor(schema)).difference(fixedsFor(schema));
        // check validity of all foreign keys
        await validateForeignKeys(schema, record, foreigns);

        // perform the actual update
        await _db.collection(collection).updateOne({ _id:id }, update);

        // registered fields must be fixed, not allowed here

        return Promise.resolve();
    } catch(e) {
        return Promise.reject("Problem updating a "+schema.name+":\n\t"+e);
    }
}

async function edit(schema: Function, id: RecordID, record: Edit): Promise<void> {
    try {
        let collection = collectionFor(schema);

        // edit interface doesn't have any foreign fields, no need to validate

        // perform the actual update
        await _db.collection(collection).updateOne({ _id:id }, update);

        // registered fields must be fixed, not allowed here

        return Promise.resolve();
    } catch(e) {
        return Promise.reject("Problem editing a "+schema.name+":\n\t"+e);
    }
}

async function remove(schema: Function, id: RecordID): Promise<void> {
    try {
        let collection = collectionFor(schema);

        // fetch data to be deleted - for the last time :(
        let record = await _db.collection(collection).findOne<Record>({_id: id});
        
        // remove all children recursively, and unregister from parents
        let foreigns = foreignsFor(schema);
        if(foreigns) for ( let foreign of foreigns ) {
            let data = foreignData(schema, foreign);

            if(data.child) {
                // get children to remove, as an array
                let keys = record[foreign];
                if ( ! (keys instanceof Array) ) keys = [keys];
                // remove each child
                for ( let key of keys ) {
                    await remove(schemaFor(data.target), key);
                }
            }

            if(data.registry) {
                // get registries to edit, as an array
                let keys = record[foreign];
                if ( ! (keys instanceof Array) ) keys = [keys];
                // unregister from each key
                for ( let key of keys ) {
                    await unregister(data.target, key, data.registry, id);
                }
            }
        }

        // perform actual deletion
        await _db.collection(collection).deleteOne({_id: id});

        return Promise.resolve();
    } catch(e) {
        return Promise.reject("Problem deleting a "+schema.name+":\n\t"+e);
    }
}
