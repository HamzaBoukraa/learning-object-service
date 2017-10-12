import { User } from './user';
import { LearningGoal } from './learning-goal';
import { LearningOutcome } from './outcome';
import { lengths } from './taxonomy';

export class LearningObject {
    private _author: User;
    get author(): User { return this._author; }

    private _name: string;
    get name(): string { return this._name; }
    set name(name: string) { this._name = name; }

    private _length: string;
    get length(): string { return this._length; }
    set length(length: string) {
        if (lengths.has(length)) this._length = length;
        else throw length+" is not a valid Learning Object class";
    }

    private _goals: LearningGoal[];
    get goals(): LearningGoal[] { return this._goals; }
    addGoal(): LearningGoal {
        let goal = new LearningGoal(this);
        this._goals.push(goal);
        return goal;
    }
    removeGoal(i: number): LearningGoal { return this._goals.splice(i, 1)[0]; }

    private _outcomes: LearningOutcome[];
    get outcomes(): LearningOutcome[] { return this._outcomes; }
    addOutcome(): LearningOutcome {
        let outcome = new LearningOutcome(this);
        this._outcomes.push(outcome);
        return outcome;
    }
    removeOutcome(i: number): LearningOutcome { return this._outcomes.splice(i, 1)[0]; }

    constructor(author: User) {
        this._author = author;
        this._name = "";
        this._length = Array.from(lengths)[0];
        this._goals = [];
        this._outcomes = [];
    }
}