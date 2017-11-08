/**
 * Define the database schema for learning outcomes.
 */

import {
    collection, unique, text, auto, fixed, foreign, field
} from './db.schema';
import { Edit, Update, Insert, Record } from './db.schema';
import { LearningObjectID, LearningOutcomeID, OutcomeID } from './db.schema';

@collection('outcomes')
export abstract class LearningOutcomeSchema {
    @auto @fixed @field
    static _id: LearningOutcomeID;

    @fixed @foreign('objects', false, 'outcomes') @field
    static source: LearningObjectID;

    @auto @field
    static author: string;  // source's author's name

    @auto @field
    static name_: string;   // source's name

    @auto @field
    static date: string;    // source's last-modified date

    @auto @text @field
    static outcome: string; // verb + text together

    @field
    static bloom: string;
    
    @field
    static verb: string;
    
    @field
    static text: string;

    @field
    static assessments: AssessmentPlanInterface[];
    
    @field
    static strategies: InstructionalStrategyInterface[];
    
    @foreign('outcomes', false) @field
    static mappings: OutcomeID[];
}

/**
 * Defines assessment plan subdocument schema.
 */
export interface AssessmentPlanInterface {
    plan: string;
    text: string;
}

/**
 * Defines instructional strategy subdocument schema.
 */
export interface InstructionalStrategyInterface {
    instruction: string;
    text: string;
}

/**
 * Defines generic outcome schema (both learning and standard).
 */
export interface OutcomeRecord extends Record {
    _id: OutcomeID;
    author: string;
    name_: string;
    date: string;
    outcome: string;
}

/* FIXME: There has got to be a way to auto-generate the
          following interfaces from the above schema. */

// all auto fields
export interface LearningOutcomeRecord extends OutcomeRecord, LearningOutcomeInsert {
    _id: LearningOutcomeID;
}

// add in fixed fields
export interface LearningOutcomeInsert extends Insert, LearningOutcomeUpdate {
    source: LearningObjectID;
}

// add in foreign fields
export interface LearningOutcomeUpdate extends Update, LearningOutcomeEdit {
    mappings: OutcomeID[];
}

// add in remaining fields
export interface LearningOutcomeEdit extends Edit {
    bloom: string;
    verb: string;
    text: string;
    assessments: AssessmentPlanInterface[];
    strategies: InstructionalStrategyInterface[];
}
