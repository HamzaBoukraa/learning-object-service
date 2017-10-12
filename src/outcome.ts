import { LearningObject } from './learning-object';
import { AssessmentPlan } from './assessment-plan';
import { InstructionalStrategy } from './instructional-strategy';
import { levels, verbs } from './taxonomy';

export interface Outcome {
    // properties of source
    author: string;    // standard outcome sources have 'authors' like 'NCWF' or 'CAE'
    name: string;      // standard outcome sources have 'names' like 'K0027' or 'Operating Systems Concepts'
    // specifics of outcome
    outcome: string;
}

export class StandardOutcome implements Outcome {
    private _author: string;
    get author(): string { return this._author; }

    private _name: string;
    get name(): string { return this._name; }

    private _outcome: string;
    get outcome(): string { return this._outcome; }

    constructor(author: string, name: string, outcome: string) {
        this._author = author,
        this._name = name
        this._outcome = outcome;
    }
}

export class LearningOutcome implements Outcome {
    private _source: LearningObject;
    get source(): LearningObject { return this._source; }
    
    private _bloom: string;
    get bloom(): string { return this._bloom; }
    set bloom(bloom: string) {
        if (levels.has(bloom)) { this._bloom = bloom; }
        else throw bloom+" is not a valid Bloom taxon";
    }
    
    private _verb: string;
    get verb(): string { return this._bloom; }
    set verb(verb: string)  {
        if (verbs[this.bloom].has(verb)) { this._verb = verb; }
        else throw verb+" is not a valid verb for the "+this.bloom+" taxon";
    }

    private _text: string;
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    private _mappings: Outcome[];
    get mappings(): Outcome[] { return this._mappings; }
    mapTo(mapping: Outcome): number { return this._mappings.push(mapping); }
    unmap(i: number): Outcome { return this._mappings.splice(i, 1)[0]; }

    private _assessments: AssessmentPlan[];
    get assessments(): AssessmentPlan[] { return this._assessments; }
    addAssessment(): AssessmentPlan {
        let assessment = new AssessmentPlan(this);
        this._assessments.push(assessment);
        return assessment;
    }
    removeAssessment(i: number): AssessmentPlan { return this._assessments.splice(i, 1)[0]; }

    private _strategies: InstructionalStrategy[];
    get strategies(): InstructionalStrategy[] { return this._strategies; }
    addStrategy(): InstructionalStrategy {
        let strategy = new InstructionalStrategy(this);
        this._strategies.push(strategy);
        return strategy;
    }
    removeStrategy(i: number): InstructionalStrategy { return this._strategies.splice(i, 1)[0]; }

    // exposed source properties
    get author(): string { return this._source.author.name; }
    get name(): string { return this._source.name; }
    get outcome(): string { return this._verb+" "+this._text; }

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
