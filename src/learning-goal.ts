import { LearningObject } from './learning-object';

export class LearningGoal {
    private _source: LearningObject;
    get source(): LearningObject { return this._source; }

    private _text: string;
    get text(): string { return this._text; }
    set text(text: string) { this._text = text; }

    constructor(source: LearningObject) {
        this._source = source;
        this._text = "";
    }
}