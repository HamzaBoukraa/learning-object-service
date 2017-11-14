/**
 * Define the database schema for learning objects.
 */

import {
    collection, unique, text, auto, fixed, foreign, field,
    Edit, Update, Insert, Record
} from './db.schema';

import { UserID } from './user.schema';
import { LearningOutcomeID } from './learning-outcome.schema';

import { DBID } from './db.schema';
export type LearningObjectID = DBID;

@collection('objects')
export abstract class LearningObjectSchema {
    @auto @fixed @field
    static _id: LearningObjectID;

    @fixed @foreign('users', false, 'objects') @unique @field
    static author: UserID;

    @unique @field
    static name_: string;

    /* FIXME: if there's a reason to use an actual Date class */
    @field
    static date: string;
    
    @field
    static length_: string;

    @field
    static goals: LearningGoalInterface[];

    @foreign('outcomes', true) @field
    static outcomes: LearningOutcomeID[];
}

/**
 * Defines learning goal subdocument schema.
 */
export interface LearningGoalInterface {
    text: string;
}

/* FIXME: There has got to be a way to auto-generate the
          following interfaces from the above schema. */

// all auto fields
export interface LearningObjectRecord extends Record, LearningObjectInsert {
    _id: LearningObjectID;
}

// add in fixed fields
export interface LearningObjectInsert extends Insert, LearningObjectUpdate {
    author: UserID;
}

// add in foreign fields
export interface LearningObjectUpdate extends Update, LearningObjectEdit {
    outcomes: LearningOutcomeID[];
}

// add in remaining fields
export interface LearningObjectEdit extends Edit {
    name_: string;
    date: string;
    length_: string;
    goals: LearningGoalInterface[];
}
