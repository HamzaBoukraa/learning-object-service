/**
 * Define the database schema for learning objects.
 */

import {
    collection, unique, text, auto, fixed, foreign, field
} from './db.schema';
import { Edit, Update, Insert, Record } from './db.schema';
import { UserID, LearningObjectID, LearningOutcomeID } from './db.schema';

@collection('objects')
export abstract class LearningObjectSchema {
    @auto @fixed @field
    static _id: LearningObjectID;

    @fixed @foreign('users', false, 'objects') @unique @field
    static author: UserID;

    @unique @field
    static name_: string;
    
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

/* TODO: There has got to be a way to auto-generate the
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
    length_: string;
    goals: LearningGoalInterface[];
}
