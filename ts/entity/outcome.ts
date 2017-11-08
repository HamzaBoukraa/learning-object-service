/**
 * Provide abstract representations for learning outcomes
 * and standard outcomes.
 */

import { LearningObject } from './learning-object';
import { AssessmentPlan } from './assessment-plan';
import { InstructionalStrategy } from './instructional-strategy';
import { levels, verbs } from './taxonomy';

/**
 * Core information fundamental to any sort of outcome.
 * @interface
 */
export interface Outcome {
    // properties of source
    author: string;    // standard outcome sources have 'authors' like 'NCWF' or 'CAE'
    name: string;      // standard outcome sources have 'names' like 'K0027' or 'Operating Systems Concepts'
    date: string;   /* FIXME: if there's a reason to use an actual Date class */
    // specifics of outcome
    outcome: string;
}

export interface OutcomeSuggestion extends Outcome {
    id: any,    // do NOT have any database dependencies in entities
}

/**
 * A class to represent a standard outcome. Immutable.
 * @class
 */
export class StandardOutcome implements Outcome {
    private _author: string;
    /**
     * @property {string} source
     *       the organization or document this outcome is drawn from
     */
    get author(): string { return this._author; }

    private _name: string;
    /**
     * @property {string} name the label or unit of the outcome
     */
    get name(): string { return this._name; }

    private _date: string;
    /**
     * @property {string} date the year this standard was established
     */
    get date(): string { return this._date; }

    private _outcome: string;
    /**
     * @property {string} outcome the text of the outcome
     */
    get outcome(): string { return this._outcome; }

    /**
     * Create a new StandardOutcome.
     * @param {string} author the new outcome's source
     * @param {string} name the new outcome's label
     * @param {string} outcome the new outcome's text
     */
    constructor(author: string, name: string, date: string, outcome: string) {
        this._author = author,
        this._name = name;
        this._date = date;
        this._outcome = outcome;
    }
}

/**
 * A class to represent a learning outcome.
 * @class
 */
export class LearningOutcome implements Outcome {
    private _source: LearningObject;
    /**
     * @property {LearningOutcome} source (immutable)
     *       the learning object this outcome belongs to
     */
    get source(): LearningObject { return this._source; }
    
    private _bloom: string;
    /**
     * @property {string} instruction
     *       the bloom taxon of this learning outcome
     *       values are resetricted according to available levels
     */
    get bloom(): string { return this._bloom; }
    set bloom(bloom: string) {
        if (levels.has(bloom)) { this._bloom = bloom; }
        else throw bloom+" is not a valid Bloom taxon";
    }
    
    private _verb: string;
    /**
     * @property {string} instruction
     *       the verb this outcome text starts with (eg. define)
     *       values are resetricted according to the bloom taxon
     */
    get verb(): string { return this._verb; }
    set verb(verb: string)  {
        if (verbs[this.bloom].has(verb)) { this._verb = verb; }
        else throw verb+" is not a valid verb for the "+this.bloom+" taxon";
    }

    private _text: string;
    /**
     * @property {string} text
     *       full text description of this outcome, except the verb
     */
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    private _mappings: Outcome[];
    /**
     * @property {Outcome[]} mappings (immutable)
     *       outcomes which presumably achieve similar things as this
     * 
     * NOTE: individual elements are freely accessible, but the array
     *       reference itself is immutable, and elements can only be
     *       added and removed by the below functions
     */
    get mappings(): Outcome[] { return this._mappings; }

    /**
     * Maps an outcome to this learning outcome.
     * @returns {number} the new length of the mappings array
     */
    mapTo(mapping: Outcome): number {
        return this._mappings.push(mapping);
    }
    
    /**
     * Removes the outcome's i-th mapping.
     * @param {number} i the index to remove from the mappings array
     * 
     * @returns {Outcome} the outcome which was removed
     */
    unmap(i: number): Outcome {
        return this._mappings.splice(i, 1)[0];
    }

    private _assessments: AssessmentPlan[];
    /**
     * @property {AssessmentPlan[]} assessments (immutable)
     *       plans to assess how well the outcome is achieved
     * 
     * NOTE: individual elements are freely accessible, but the array
     *       reference itself is immutable, and elements can only be
     *       added and removed by the below functions
     */
    get assessments(): AssessmentPlan[] { return this._assessments; }

    /**
     * Adds a new, blank assessment plan to this outcome.
     * @returns {AssessmentPlan} a reference to the new assessment plan
     */
    addAssessment(): AssessmentPlan {
        let assessment = new AssessmentPlan(this);
        this._assessments.push(assessment);
        return assessment;
    }

    /**
     * Removes the outcome's i-th assessment plan.
     * @param {number} i the index to remove from the assessments array
     * 
     * @returns {LearningObject} the assessment plan which was removed
     */
    removeAssessment(i: number): AssessmentPlan {
        return this._assessments.splice(i, 1)[0];
    }

    private _strategies: InstructionalStrategy[];
    /**
     * @property {InstructionalStrategy[]} strategies (immutable)
     *       strategies on how to achieve the outcome
     * 
     * NOTE: individual elements are freely accessible, but the array
     *       reference itself is immutable, and elements can only be
     *       added and removed by the below functions
     */
    get strategies(): InstructionalStrategy[] { return this._strategies; }

    /**
     * Adds a new, blank instructional strategy to this outcome.
     * @returns {InstructionalStrategy} a reference to the new strategy
     */
    addStrategy(): InstructionalStrategy {
        let strategy = new InstructionalStrategy(this);
        this._strategies.push(strategy);
        return strategy;
    }

    /**
     * Removes the outcome's i-th instructional strategy.
     * @param {number} i the index to remove from the strategies array
     * 
     * @returns {LearningObject} the strategy which was removed
     */
    removeStrategy(i: number): InstructionalStrategy {
        return this._strategies.splice(i, 1)[0];
    }

    /**
     * properties for consistency with the Outcome interface
     * @property {string} author
     * @property {string} name
     * @property {string} date
     * @property {string} outcome
     */
    get author(): string { return this._source.author.name; }
    get name(): string { return this._source.name; }
    get date(): string { return this._source.date; }
    get outcome(): string { return this._verb+" "+this._text; }

    /**
     * Construct a new, blank LearningOutcome.
     * @param {LearningObject} source the learning object
     *       the new learning outcome belongs to
     * 
     * @constructor
     */
    constructor(source: LearningObject) {
        this._source = source;
        this._bloom = Array.from(levels)[0];
        this._verb = Array.from(verbs[this._bloom])[0];
        this._text = "";
        this._mappings = [];
        this._assessments = [];
        this._strategies = [];
    }
}
