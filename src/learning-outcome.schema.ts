import { collection, unique, text, auto, fixed, foreign, field } from './db.schema';
import { Edit, Update, Insert, Record } from './db.schema';
import { LearningObjectID, LearningOutcomeID, OutcomeID } from './db.schema';

@collection('outcomes')
export abstract class LearningOutcomeSchema {
    @auto @fixed @field
    static _id: LearningOutcomeID;

    @fixed @foreign('objects', false, 'outcomes') @field
    static source: LearningObjectID;

    @auto @fixed
    static author: string;  // source's author's name

    @auto @fixed
    static name_: string;   // source's name

    @field
    static bloom: string;
    
    @field
    static verb: string;
    
    @text @field
    static text: string;

    @field
    static assessments: AssessmentPlanInterface[];
    
    @field
    static strategies: InstructionalStrategyInterface[];
    
    @foreign('outcomes', false) @field
    static mappings: OutcomeID[];
}

export interface AssessmentPlanInterface {
    plan: string;
    text: string;
}

export interface InstructionalStrategyInterface {
    instruction: string;
    text: string;
}

// for enforcing general Outcome contract
export interface OutcomeRecord extends Record {
    author: string;
    name_: string;
    text: string;
}

/*
 *  TODO: There has got to be a way to auto-generate the following interfaces
 *      from the above schema.
 */

// all auto fields
export interface LearningOutcomeRecord extends OutcomeRecord, LearningOutcomeInsert {
    _id: string;
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
