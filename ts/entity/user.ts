/**
 * Provide an abstract representation for a Bloomin' Onion user.
 */

import { LearningObject } from './learning-object';

/**
 * A class to represent Bloomin' Onion users.
 * @class
 */
export class User {
    private _id: string;
    /**
     * @property {string} id a user's unique log-in id
     */
    get id(): string { return this._id; }
    set id(id: string) { this._id = id; }

    private _name: string;
    /**
     * @property {string} name a user's real-life name
     */
    get name(): string { return this._name; }
    set name(name: string) { this._name = name; }
    
    private _objects: LearningObject[];
    /**
     * @property {LearningObject[]} objects (immutable)
     *       an array of a user's learning objects
     * 
     * NOTE: individual elements are freely accessible, but the array
     *       reference itself is immutable, and elements can only be
     *       added and removed by the below functions
     */
    get objects(): LearningObject[] { return this._objects; }

    /**
     * Adds a new, blank learning object to this user.
     * @returns {LearningObject} a reference to the new learning object
     */
    addObject(): LearningObject {
        let object = new LearningObject(this);
        this._objects.push(new LearningObject(this));
        return object
    }

    /**
     * Removes the user's i-th learning object.
     * @param {number} i the index to remove from the objects array
     * 
     * @returns {LearningObject} the learning object which was removed
     */
    removeObject(i: number): LearningObject {
        return this._objects.splice(i, 1)[0];
    }

    /**
     * Construct a new User, given starting user id and name.
     * @param {string} id the user's unique log-in id
     * @param {string} name the user's real-life name
     * 
     * @constructor
     */
    constructor(id: string, name: string) {
        this._id = id;
        this._name = name;
        this._objects = [];
    }
}