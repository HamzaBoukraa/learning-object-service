import { User } from './user';
import { LearningGoal } from './learning-goal';
import { LearningOutcome } from './learning-outcome';
import { depths } from './taxonomy';

export interface LearningOutcomeSource {
    name: string;           // standard outcome sources have 'names' like 'K0027' or 'Operating Systems Concepts'
    author: string|User;    // standard outcome sources have 'authors' like 'NCWF' or 'CAE'
}

export class LearningObject implements LearningOutcomeSource {
    private _author: User;
    get author(): User { return this._author; }

    private _name: string;
    get name(): string { return this._name; }
    set name(name: string) { this._name = name; }

    private _depth: string;
    get depth(): string { return this._depth; }
    set depth(depth: string) {
        if (depth in depths) this._depth = depth;
        else throw depth+" is not a valid Learning Object class";
    }

    private _goals: LearningGoal[];
    get goals(): LearningGoal[] { return this._goals; }
    addGoal(): number { return this._goals.push(new LearningGoal(this)); }
    removeGoal(i: number): LearningGoal { return this._goals.splice(i, 1)[0]; }

    private _outcomes: LearningOutcome[];
    get outcomes(): LearningOutcome[] { return this._outcomes; }
    addOutcome(): number { return this._outcomes.push(new LearningOutcome(this)); }
    removeOutcome(i: number): LearningOutcome { return this._outcomes.splice(i, 1)[0]; }

    constructor(author: User) {
        this._author = author;
        this._name = "";
        this._depth = depths[0];
        this._goals = [];
        this._outcomes = [];
    }
}