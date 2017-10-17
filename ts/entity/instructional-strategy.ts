/**
 * Provide an abstract representation for a learning outcome's
 * instructional strategy.
 */

import { LearningOutcome } from './outcome';
import { levels, instructions } from './taxonomy';

/**
 * A class to represent a learning outcome's instructional strategy.
 * @class
 */
export class InstructionalStrategy {
    private _source: LearningOutcome;
    /**
     * @property {LearningOutcome} source (immutable)
     *       the outcome this instructional strategy belongs to
     */
    get source(): LearningOutcome { return this._source; }
    
    private _instruction: string;
    /**
     * @property {string} instruction
     *       the class of this instructional strategy (eg. lecture)
     *       values are resetricted according to source's bloom taxon
     */
    get instruction(): string { return this._instruction; }
    set instruction(instruction: string) {
        if (instructions[this._source.bloom].has(instruction)) { this._instruction = instruction; }
        else throw instruction+" is not a valid instructional strategy for the "+this._source.bloom+" taxon";
    }

    private _text: string;
    /**
     * @property {string} text
     *       full text description of this instructional strategy
     */
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    /**
     * Construct a new, blank InstructionalStrategy.
     * @param {LearningOutcome} source the learning outcome
     *       the new instructional strategy belongs to
     * 
     * @constructor
     */
    constructor(source: LearningOutcome) {
        this._source = source;
        this._instruction = Array.from(instructions[source.bloom])[0];
        this._text = "";
    }
}