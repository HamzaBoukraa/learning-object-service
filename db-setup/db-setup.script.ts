// this script runs each subscript needed to get the database to its initial state,
//  including collection initialization and initial data

// tslint:disable-next-line: no-require-imports
require('../useme');

import * as lineReader from 'line-reader';

import { MongoClient, Db } from 'mongodb';

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';

import { DBGluer } from '../db.gluer';
import { StandardOutcome } from 'clark-entity';
import {
    collections, schemaFor, collectionFor, uniquesFor, textsFor,
} from '../schema/db.schema';
import {
    UserSchema, LearningObjectSchema, LearningOutcomeSchema,
} from '../schema/schema';

/**
 * Initialize database with collections and indexes as defined by schema
 * NOTE: this destroys all data already in the database
 *
 * @param {Db} prod mongo Db object connected to db being initialized
 */
export async function init(db: Db) {
    // drop collections
    for (let collection of collections()) {
        try {
            await db.dropCollection(collection);
            console.log('Deleted existing collection: ' + collection);
        } catch (e) {/* an error here simply means there was no collection to drop*/ }
    }

    // add collections
    try {
        for (let collection of collections()) {

            let c = await db.createCollection(collection);
            console.log('Created collection ' + collection);

            let uniques = uniquesFor(schemaFor(collection));
            let texts = textsFor(schemaFor(collection));

            // index creation is slightly different if both have the same properties
            if (uniques && texts && uniques.equals(texts)) {
                let props = {};
                for (let text of texts) {
                    props[text] = 'text';
                }
                await c.createIndex(props, { unique: true });
                console.log('Created joint unique-text index on ' + texts.toString() + ' for ' + collection + ' collection');
            } else {
                if (uniques) {
                    let props = {};
                    for (let unique of uniques) {
                        props[unique] = 1;
                    }
                    await c.createIndex(props, { unique: true });
                    console.log('Created unique index on ' + uniques.toString() + ' for ' + collection + ' collection');
                }
                // create text index
                if (texts) {
                    let props = {};
                    for (let text of texts) {
                        props[text] = 'text';
                    }
                    await c.createIndex(props);
                    console.log('Created text index on ' + texts.toString() + ' for ' + collection + ' collection');
                }
            }
        }

        return Promise.resolve();
    } catch (e) {
        return Promise.reject('Initialization failed: ' + e);
    }
}

/**
 * Add standard outcomes from data file
 *
 * Data file has two columns: [ name | outcome ] separated by tab
 *
 * @param {string} author author-label for all outcomes in the file
 * @param {string} date date-label for all outcomes in the file
 * @param {string} file file path/name of data file
 * @param {DBGluer} glue gluer connected to db being filled
 */
export async function addStandards(author: string, date: string, file: string, glue: DBGluer) {
    return new Promise<void>((resolve, reject) => {
        let promises: Promise<any>[] = [];
        let cnt = 0;    // count successful adds

        // what to do for each record
        lineReader.eachLine(file, function (line, last) {
            let dat = line.split('\t');
            if (dat.length === 2) {
                let outcome = new StandardOutcome(author, dat[0], date, dat[1]);
                promises.push(
                    glue.addStandardOutcome(outcome)
                        .then(() => {
                            cnt += 1;
                            return Promise.resolve();
                        })
                        .catch((err) => { console.log(author + 'insertion error: ' + err); }),
                );
            } else {    // data formatting error
                console.log('Could not process line: ' + line);
            }

            // if we just processed the last line, wait to resolve all promises
            if (last) {
                Promise.all(promises)
                       .then(() => {
                            console.log(cnt + ' ' + author + ' standard outcomes added');
                            resolve();
                        })
                       .catch((e) => { reject(e); });
            }
        });
    });
}

async function copyCollection(collection: string, tmp: Db, prod: Db) {
    return new Promise<void>((resolve, reject) => {
        let promises: Promise<any>[] = [];

        let docs = tmp.collection(collection).find();
        docs.forEach(
            (doc) => {
                promises.push(prod.collection(collection).insertOne(doc));
            },
            (err) => {
                if (err) reject(err);
                else Promise.all(promises)
                            .then(() => { resolve(); })
                            .catch((e) => { reject(e); });
            },
        );
    });
}

async function copyOutcome(outcome: any, tmp: Db, prod: Db, glue: DBGluer) {
    try {
        let collection = collectionFor(LearningOutcomeSchema);
        if ( !outcome.mappings ) return Promise.resolve();    // skip standard outcomes

        let index = 0;
        while (index < outcome.mappings.length) {
            let mapping = await tmp.collection(collection)
                                .findOne({ _id: outcome.mappings[index] });
            if ( !outcome.mappings ) {   // now skip non-standard outcomes
                let analog = await prod.collection(collection)
                                    .findOne({ tag: mapping.tag });

                // if mapped standard outcome is not in production, splice it out
                if ( !analog ) outcome.mappings.splice(index, 1);   // length decrements
                // otherwise, replace with the new objectid
                else {
                    outcome.mappings[index] = analog._id;
                    index += 1;                                    // index increments
                }
            }
        }

        await prod.collection(collection).insertOne(outcome);
        return Promise.resolve();
    } catch (err) {
        return Promise.reject(err);
    }
}

async function copyOutcomes(tmp: Db, prod: Db, glue: DBGluer) {
    let collection = collectionFor(LearningOutcomeSchema);
    return new Promise<void>((resolve, reject) => {
        let outcomes = tmp.collection(collection).find();
        let promises: Promise<void>[] = [];
        outcomes.forEach(
            (doc) => {
                promises.push(copyOutcome(doc, tmp, prod, glue));
            },
            (err) => {
                if (err) reject(err);
                else Promise.all(promises)
                            .then(() => { resolve(); })
                            .catch((e) => { reject(e); });
            });
    });
}

/**
 * Merge user-created data into production server.
 * NOTE: at present this function is only meant to act on
 *       an initialized database but empty save for standard outcomes
 *       That is, there is no safeguarding against
 *          duplicate user-created data.
 *
 * @param {Db} tmp mongo Db object connected to temporary dump db for live data
 * @param {Db} prod mongo Db object connected to db being filled
 * @param {DBGluer} glue gluer connected to db being filled
 */
export async function merge(tmp: Db, prod: Db, glue: DBGluer) {
    return Promise.all([
            copyCollection(collectionFor(UserSchema), tmp, prod),
            copyCollection(collectionFor(LearningObjectSchema), tmp, prod),
            copyOutcomes(tmp, prod, glue),
        ]);
}


// run initialization script
if (require.main === module) {
    console.log('--- Initializing ---');
    MongoClient.connect(process.env.CLARK_DB_URI, async (err, dbase) => {
        try {
            if (err) throw err;

            await init(dbase);
            dbase.close();

            let db: DBInterface = new MongoDriver();
            let hash: HashInterface = new BcryptDriver(10);
            let glue = new DBGluer(db, hash);

            await db.connect(process.env.CLARK_DB_URI);
            console.log('--- Adding Standard Outcomes ---');
            await Promise.all([
                addStandards('NCWF', '2017', 'dbcontent/NIST.SP.800-181.dat', glue),
                addStandards('NCWF Tasks', '2017', 'dbcontent/NIST.SP.800-181.tasks.dat', glue),
                addStandards('CAE', '2014', 'dbcontent/CAE-CD_Knowledge_Units.dat', glue),
                addStandards('CS 2013', '2013', 'dbcontent/CS_2013_Learning_Outcomes.dat', glue),
            ]);
            db.disconnect();

            // if env variable 'SKIP_MERGE' exists, do not merge from tmp db
            if (!process.env.SKIP_MERGE) {
                let production = await MongoClient.connect(process.env.CLARK_DB_URI);
                let backup = await MongoClient.connect(process.env.CLARK_DB_URI.replace('onion', 'tmp'));
                console.log('--- Merging previous data ---');
                await merge(backup, production, glue);

                production.close();
                backup.close();
            }
        } catch (e) {
            console.log('Setup incomplete:' + e);
        }
    });
}
