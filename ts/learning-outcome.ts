import { LearningOutcomeSource, LearningObject } from './learning-object';
import { AssessmentPlan } from './assessment-plan';
import { InstructionalStrategy } from './instructional-strategy';
import { levels, verbs } from './taxonomy';

export interface Outcome {
    text: string;
    source: LearningOutcomeSource;
}

export class LearningOutcome implements Outcome {
    
    private _source: LearningOutcomeSource;
    get source(): LearningOutcomeSource { return this._source; }
    
    private _bloom: string;
    get bloom(): string { return this._bloom; }
    set bloom(bloom: string) {
        if (bloom in levels) { this._bloom = bloom; }
        else throw bloom+" is not a valid Bloom taxon";
    }
    
    private _verb: string;
    get verb(): string { return this._bloom; }
    set verb(verb: string)  {
        if (verb in levels[this.bloom]) { this._verb = verb; }
        else throw verb+" is not a valid verb for the "+this.bloom+" taxon";
    }

    private _text: string;
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    private _mappings: Outcome[];
    get mappings(): Outcome[] { return this._mappings; }

    private _assessments: AssessmentPlan[];
    get assessments(): AssessmentPlan[] { return this._assessments; }
    addAssessment(): number { return this._assessments.push(new AssessmentPlan(this)); }
    removeAssessment(i: number): AssessmentPlan { return this._assessments.splice(i, 1)[0]; }

    private _instructions: InstructionalStrategy[];
    get instructions(): InstructionalStrategy[] { return this._instructions; }
    addInstruction(): number { return this._instructions.push(new InstructionalStrategy(this)); }
    removeInstruction(i: number): InstructionalStrategy { return this._instructions.splice(i, 1)[0]; }

    constructor(source: LearningOutcomeSource) {
        this._source = source;
        this._bloom = levels[0];
        this._verb = verbs[levels[0]][0];
        this._text = "";
        this._mappings = [];
        this._assessments = [];
        this._instructions = [];
    }
}
