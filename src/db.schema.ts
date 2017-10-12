import { ObjectID } from './db.driver';

export type UserID = ObjectID;
export type LearningObjectID = ObjectID;
export type LearningOutcomeID = ObjectID;
export type StandardOutcomeID = ObjectID;
export type OutcomeID = LearningOutcomeID|StandardOutcomeID;
export type RecordID = UserID|LearningObjectID|OutcomeID;

export interface Edit {}
export interface Update {}
export interface Insert {}
export interface Record {}

interface ForeignData {
    target: string;
    child: boolean;
    registry?: string;
}

let _schemas: { [collection:string]: Function } = {};
let _collections: { [collection:string]: string } = {};
let _foreignData: { [collection:string]: { [foreign:string]: ForeignData } } = {};

let _uniques: { [collection:string]: Set<string> } = {};
let _texts: { [collection:string]: Set<string> } = {};
let _autos: { [collection:string]: Set<string> } = {};
let _fixeds: { [collection:string]: Set<string> } = {};
let _foreigns: { [collection:string]: Set<string> } = {};
let _fields: { [collection:string]: Set<string> } = {};

// miscellaneous schema info

export function collections(): Set<string> {
    return new Set(Object.keys(_schemas));
}

export function schemaFor(collection: string) {
    return _schemas[collection];
}

export function collectionFor(schema: Function): string {
    return _collections[schema.name];
}

export function foreignData(schema: Function, foreign: string): ForeignData {
    return _foreignData[schema.name][foreign];
}

// field info

export function uniquesFor(schema: Function): Set<string> {
    return _uniques[schema.name];
}

export function textsFor(schema: Function): Set<string> {
    return _texts[schema.name];
}

export function autosFor(schema: Function): Set<string> {
    return _autos[schema.name];
}

export function fixedsFor(schema: Function): Set<string> {
    return _fixeds[schema.name];
}

export function foreignsFor(schema: Function): Set<string> {
    return _foreigns[schema.name];
}

export function fieldsFor(schema: Function): Set<string> {
    return _fields[schema.name];
}

// decorators

/**
 * Everything with the same collection name ought to decorate the same
 *  unique, text, and child properties. If not, no guarantees what
 *  indexes are created or what happens on deletion... :)
 * @param name 
 */
export function collection(name: string) {
    return function(schema: Function) {
        _schemas[name] = schema;
        _collections[schema.name] = name;
    }
}

export function unique(schema: Function, name: string) {
    if( ! (schema.name in _uniques) ) _uniques[schema.name] = new Set<string>();
    _uniques[schema.name].add(name);
}

export function text(schema: Function, name: string) {
    if( ! (schema.name in _texts) ) _texts[schema.name] = new Set<string>();
    _texts[schema.name].add(name);
}

export function auto(schema: Function, name: string) {
    if( ! (schema.name in _autos) ) _autos[schema.name] = new Set<string>();
    _autos[schema.name].add(name);
}

export function fixed(schema: Function, name: string) {
    if( ! (schema.name in _fixeds) ) _fixeds[schema.name] = new Set<string>();
    _fixeds[schema.name].add(name);
}

/**
 * 
 * @param target - the collection in which the value(s) of the decorated property
 *          must be valid _id's
 * @param child - if true, the foreign documents referenced by the decorated
 *          property will be deleted if the decorated document is deleted
 * @param register - if provided, the array property name of the foreign document
 *          which must contain the decorated document's _id
 *          NOTE: registered fields must also be fixed!
 */
export function foreign(target: string, child: boolean, registry?: string) {
    return function(schema: Function, name: string) {
        if( ! (schema.name in _foreigns) ) _foreigns[schema.name] = new Set<string>();
        _foreigns[schema.name].add(name);

        if( ! (schema.name in _foreignData) ) _foreignData[schema.name] = {};
        _foreignData[schema.name][name] = <ForeignData>{
            target: target,
            child: child,
            registry: registry
        };
    }
}

export function field(schema: Function, name: string) {
    if( ! (schema.name in _fields) ) _fields[schema.name] = new Set<string>();
    _fields[schema.name].add(name);
}




function decorate(schema: Function) {
    schema.name;    // just a simple expression to force javascript to declare the class
}

import { UserSchema } from './user.schema';
import { LearningOutcomeSchema } from './learning-outcome.schema';
import { StandardOutcomeSchema } from './standard-outcome.schema';
import { LearningObjectSchema } from './learning-object.schema';

// declare the classes to trigger all the decorator functions
decorate(UserSchema);
decorate(StandardOutcomeSchema);
decorate(LearningOutcomeSchema);
decorate(LearningObjectSchema);

// TODO: I don't know if there's a better place to put these..?
Set.prototype.difference = function<T>(this:Set<T>, by:Set<T>): Set<T> {
    let difference = new Set<T>(this);
    if(by) for ( let elem of by ) {
        difference.delete(elem);
    }
    return difference;
}

Set.prototype.equals = function<T>(this:Set<T>, to:Set<T>): boolean {
    for ( let elem of this ) if (!to.has(elem))   return false;
    for ( let elem of to   ) if (!this.has(elem)) return false;
    return true;
}

Set.prototype.toString = function<T>(this:Set<T>): string {
    return "{"+Array.from(this).toString()+"}";
}