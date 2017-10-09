import { LearningOutcome } from './learning-outcome';
import { levels, instructions } from './taxonomy';

export class InstructionalStrategy {
    private _source: LearningOutcome;
    get source(): LearningOutcome { return this._source; }

    private _strategy: string;
    get strategy(): string { return this._strategy; }
    set strategy(strategy: string) {
        if (strategy in instructions[this._source.bloom]) { this._strategy = strategy; }
        else throw strategy+" is not a valid instructional strategy for the "+this._source.bloom+" taxon";
    }

    private _text: string;
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    constructor(source: LearningOutcome) {
        this._source = source;
        this._strategy = instructions[source.bloom][0];
        this._text = "";
    }
}