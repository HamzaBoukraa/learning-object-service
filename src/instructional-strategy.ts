import { LearningOutcome } from './outcome';
import { levels, instructions } from './taxonomy';

export class InstructionalStrategy {
    private _source: LearningOutcome;
    get source(): LearningOutcome { return this._source; }

    private _instruction: string;
    get instruction(): string { return this._instruction; }
    set instruction(instruction: string) {
        if (instructions[this._source.bloom].has(instruction)) { this._instruction = instruction; }
        else throw instruction+" is not a valid instructional strategy for the "+this._source.bloom+" taxon";
    }

    private _text: string;
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    constructor(source: LearningOutcome) {
        this._source = source;
        this._instruction = Array.from(instructions[source.bloom])[0];
        this._text = "";
    }
}