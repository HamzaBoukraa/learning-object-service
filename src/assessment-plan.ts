/**
 * Provide an abstract representation for a learning outcome's
 * assessment plan.
 */

import { LearningOutcome } from './outcome';
import { levels, assessments } from './taxonomy';

/**
 * A class to represent a learning outcome's assessment plan.
 * @class
 */
export class AssessmentPlan {
    private _source: LearningOutcome;
    /**
     * @property {LearningOutcome} source (immutable)
     *       the outcome this assessment plan belongs to
     */
    get source(): LearningOutcome { return this._source; }

    private _plan: string;
    /**
     * @property {string} instruction
     *       the class of this assessment plan (essay, test, etc.)
     *       values are resetricted according to source's bloom taxon
     */
    get plan(): string { return this._plan; }
    set plan(plan: string) {
        if (assessments[this._source.bloom].has(plan)) { this._plan = plan; }
        else throw plan+" is not a valid assessment plan for the "+this._source.bloom+" taxon";
    }

    private _text: string;
    /**
     * @property {string} text
     *       full text description of this instructional strategy
     */
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    /**
     * Construct a new, blank AssessmentPlan.
     * @param {LearningOutcome} source the learning outcome
     *       the new assessment plan belongs to
     * 
     * @constructor
     */
    constructor(source: LearningOutcome) {
        this._source = source;
        this._plan = Array.from(assessments[source.bloom])[0];
        this._text = "";
    }
}