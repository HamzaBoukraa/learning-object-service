/**
 * Provide abstract representations for learning objects.
 */

import { User } from './user';
import { LearningGoal } from './learning-goal';
import { LearningOutcome } from './outcome';
import { lengths } from './taxonomy';

/**
 * A class to represent a learning object.
 * @class
 */
export class LearningObject {
    private _author: User;
    /**
     * @property {User} author (immutable)
     *       the user this learning object belongs to
     */
    get author(): User { return this._author; }

    private _name: string;
    /**
     * @property {string} length
     *       the object's identifying name, unique over a user
     */
    get name(): string { return this._name; }
    set name(name: string) { this._name = name; }

    private _length: string;
    /**
     * @property {string} length
     *       the object's class, determining its length (eg. module)
     *       values are resetricted according to available lengths
     */
    get length(): string { return this._length; }
    set length(length: string) {
        if (lengths.has(length)) this._length = length;
        else throw length+" is not a valid Learning Object class";
    }

    private _goals: LearningGoal[];
    /**
     * @property {LearningGoal[]} goals (immutable)
     *       goals this learning object should achieve
     * 
     * NOTE: individual elements are freely accessible, but the array
     *       reference itself is immutable, and elements can only be
     *       added and removed by the below functions
     */
    get goals(): LearningGoal[] { return this._goals; }

    /**
     * Adds a new, blank learning goal to this object.
     * @returns {AssessmentPlan} a reference to the new goal
     */
    addGoal(): LearningGoal {
        let goal = new LearningGoal(this);
        this._goals.push(goal);
        return goal;
    }

    /**
     * Removes the object's i-th learning goal.
     * @param {number} i the index to remove from the goals array
     * 
     * @returns {LearningObject} the goal which was removed
     */
    removeGoal(i: number): LearningGoal {
        return this._goals.splice(i, 1)[0];
    }

    private _outcomes: LearningOutcome[];
    /**
     * @property {LearningOutcome[]} outcomes (immutable)
     *       outcomes this object should enable students to achieve
     * 
     * NOTE: individual elements are freely accessible, but the array
     *       reference itself is immutable, and elements can only be
     *       added and removed by the below functions
     */
    get outcomes(): LearningOutcome[] { return this._outcomes; }

    /**
     * Adds a new, blank learning outcome to this object.
     * @returns {AssessmentPlan} a reference to the new outcome
     */
    addOutcome(): LearningOutcome {
        let outcome = new LearningOutcome(this);
        this._outcomes.push(outcome);
        return outcome;
    }

    /**
     * Removes the object's i-th learning outcome.
     * @param {number} i the index to remove from the outcomes array
     * 
     * @returns {LearningObject} the learning outcome which was removed
     */
    removeOutcome(i: number): LearningOutcome {
        return this._outcomes.splice(i, 1)[0];
    }

    /**
     * Construct a new, blank LearningOutcome.
     * @param {User} source the author the new object belongs to
     * 
     * @constructor
     */
    constructor(author: User) {
        this._author = author;
        this._name = "";
        this._length = Array.from(lengths)[0];
        this._goals = [];
        this._outcomes = [];
    }
}