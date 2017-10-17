/**
 * Define the database schema for standard outcomes.
 */
import {
    collection, unique, text, auto, fixed, foreign, field
} from './db.schema';
import { Edit, Update, Insert, Record } from './db.schema';
import { StandardOutcomeID } from './db.schema';
import { OutcomeRecord } from './learning-outcome.schema';

@collection('outcomes')
export abstract class StandardOutcomeSchema {
    @auto @fixed @field
    static _id: StandardOutcomeID;
    
    @fixed @field
    static author: string;
    
    @fixed @field
    static name_: string;

    @auto @fixed @text @field
    static outcome: string;
}

/* FIXME: There has got to be a way to auto-generate the
          following interfaces from the above schema. */

// all auto fields
export interface StandardOutcomeRecord extends OutcomeRecord, StandardOutcomeInsert {
    _id: string;
}

// add in fixed fields
export interface StandardOutcomeInsert extends Insert, StandardOutcomeUpdate {
    author: string;
    name_: string;
    outcome: string;
}

// add in foreign fields
export interface StandardOutcomeUpdate extends Update, StandardOutcomeEdit {}

// add in remaining fields
export interface StandardOutcomeEdit extends Edit {}

