/**
 * Provide an abstract representation for a learning object's
 * learning goal.
 */
import { LearningObject } from './learning-object';

/**
 * A class to represent a learning object's learning goal.
 * @class
 */
export class LearningGoal {
    private _source: LearningObject;
    /**
     * @property {LearningObject} source (immutable)
     *       the learning object this goal belongs to
     */
    get source(): LearningObject { return this._source; }

    private _text: string;
    /**
     * @property {string} text text content of this learning goal
     */
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    /**
     * Construct a new, blank InstructionalStrategy.
     * @param {LearningObject} source the learning object
     *       the new learning goal belongs to
     * 
     * @constructor
     */
    constructor(source: LearningObject) {
        this._source = source;
        this._text = "";
    }
}