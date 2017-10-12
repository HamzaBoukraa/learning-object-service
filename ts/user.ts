import { LearningObject } from './learning-object';

export class User {
    private _id: string;
    get id(): string { return this._id; }

    private _name: string;
    get name(): string { return this._name; }
    
    private _objects: LearningObject[];
    get objects(): LearningObject[] { return this._objects; }
    addObject(): LearningObject {
        let object = new LearningObject(this);
        this._objects.push(new LearningObject(this));
        return object
    }
    removeObject(i: number): LearningObject { return this._objects.splice(i, 1)[0]; }

    constructor(id: string, name: string) {
        this._id = id;
        this._name = name;
        this._objects = [];
    }
}