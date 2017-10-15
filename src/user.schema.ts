/**
 * Define the database schema for Bloomin' Onion users.
 */

import {
    collection, unique, text, auto, fixed, foreign, field
} from './db.schema';
import { Edit, Update, Insert, Record } from './db.schema';
import { UserID, LearningObjectID } from './db.schema';

@collection('users')
export abstract class UserSchema {
    @auto @fixed @field
    static _id: UserID;

    @unique @field
    static id: string

    @field
    static name_: string;

    @foreign('objects', true) @field
    static objects: LearningObjectID[];
}

/* TODO: There has got to be a way to auto-generate the
         following interfaces from the above schema. */

// all auto fields
export interface UserRecord extends Record, UserInsert {
    _id: string
}

// add in fixed fields
export interface UserInsert extends Insert, UserUpdate {}

// add in foreign fields
export interface UserUpdate extends Update, UserEdit {
    objects: LearningObjectID[]
}

// add in remaining fields
export interface UserEdit extends Edit {
    id: string,
    name_: string
}
