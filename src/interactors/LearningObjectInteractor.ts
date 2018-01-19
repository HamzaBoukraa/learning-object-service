import { DataStore, Responder, Interactor } from '../interfaces/interfaces';

import {
    UserID,
    LearningObjectID,
    OutcomeID,
    LearningOutcomeID,
    StandardOutcomeID,
    AssessmentPlanInterface,
    InstructionalStrategyInterface,
    LearningGoalInterface,
    LearningObjectRecord,
} from 'clark-schema';

import {
    User,
    LearningObject,
    Outcome,
    StandardOutcome,
    LearningOutcome,
    LearningGoal,
    AssessmentPlan,
    InstructionalStrategy,
} from 'clark-entity';

import { ObjectId } from 'bson';


export class LearningObjectInteractor implements Interactor{
    private _responder: Responder;

    public set responder(responder: Responder) {
        this._responder = responder;
    }

    constructor(private dataStore: DataStore) { }

    /**
        * Load the scalar fields of a user's objects (ignore goals and outcomes).
        * @async
        *
        * @param {string} userid the user's login id
        *
        * @returns {User}
        */
    async loadLearningObjectSummary(id: UserID): Promise<void> {
        try {
            let record = await this.dataStore.fetchUser(id);

            let summary: LearningObject[] = [];
            for (let objectid of record.objects) {
                let objectRecord = await this.dataStore.fetchLearningObject(objectid);
                let object = new LearningObject(null);
                object.name = objectRecord.name_;
                object.date = objectRecord.date;
                object.length = objectRecord.length_;
                // not a deep operation - ignore goals and outcomes
                summary.push(object);
            }

            this.responder.sendObject(summary);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    };

    /**
     * Load a learning object and all its learning outcomes.
     * @async
     *
     * @param {UserID} author the author's database id
     * @param {string} name the learning object's identifying string
     *
     * @returns {LearningObject}
     */
    async loadLearningObject(id: LearningObjectID): Promise<void> {
        try {
            let record = await this.dataStore.fetchLearningObject(id);
            let authorRecord = await this.dataStore.fetchUser(record.authorID);
            let author = new User(authorRecord.username, authorRecord.name_, null, null);
            let object = new LearningObject(author);
            object.name = record.name_;
            object.date = record.date;
            object.length = record.length_;
            for (let rGoal of record.goals) {
                let goal = object.addGoal();
                goal.text = rGoal.text;
            }

            // load each outcome
            for (let outcomeid of record.outcomes) {
                let rOutcome = await this.dataStore.fetchLearningOutcome(outcomeid);

                let outcome = object.addOutcome();
                outcome.bloom = rOutcome.bloom;
                outcome.verb = rOutcome.verb;
                outcome.text = rOutcome.text;
                for (let rAssessment of rOutcome.assessments) {
                    let assessment = outcome.addAssessment();
                    assessment.plan = rAssessment.plan;
                    assessment.text = rAssessment.text;
                }
                for (let rStrategy of rOutcome.strategies) {
                    let strategy = outcome.addStrategy();
                    strategy.instruction = rStrategy.instruction;
                    strategy.text = rStrategy.text;
                }

                // only extract the basic info for each mapped outcome
                for (let mapid of rOutcome.mappings) {
                    let rMapping = await this.dataStore.fetchOutcome(mapid);
                    outcome.mapTo({
                        author: rMapping.author,
                        name: rMapping.name_,
                        date: rMapping.date,
                        outcome: rMapping.outcome,
                    });
                }
            }

            // load the repository:
            object.repository = record.repository;

            this.responder.sendObject(object);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    }

    /**
     * Add a new learning object to the database.
     * NOTE: this function only adds basic fields;
     *       the user.outcomes field is ignored
     * NOTE: promise rejected if another learning object
     *       tied to the same author and with the same 'name' field
     *       already exists
     *
     * @async
     *
     * @param {UserID} author - database id of the parent
     * @param {LearningObject} object - entity to add
     *
     * @returns {LearningObjectID} the database id of the new record
     */
    async addLearningObject(authorID: UserID, object: LearningObject): Promise<void> {
        try{
            let learningObjectID = await this.dataStore.insertLearningObject({
            authorID: authorID,
            name_: object.name,
            date: object.date,
            length_: object.length,
            goals: this.documentGoals(object.goals),
            outcomes: [],
            repository: object.repository,
        });


        await Promise.all(object.outcomes.map((outcome: LearningOutcome) => {
            return this.addLearningOutcome(learningObjectID, outcome);
        }));

        this.responder.sendObject(learningObjectID);
    } catch (e){
        this.responder.sendOperationError(e);
    }


    }

    /**
     * Look up a learning outcome by its source and tag.
     * @async
     *
     * @param {LearningObjectID} source the object source's unique database id
     * @param {number} tag the outcome's unique identifier
     *
     * @returns {LearningOutcomeID}
     */
    async findLearningObject(userID: UserID, learningObjectName: string): Promise<void> {
        try {
            let learningObject = this.dataStore.findLearningObject(userID, learningObjectName);
            this.responder.sendObject(learningObject);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    }

    /**
     * Update an existing learning object record.
     * NOTE: this function only updates basic fields;
     *       the object.outcomes fields is ignored
     * NOTE: promise rejected if another learning object
     *       tied to the same author and with the same 'name' field
     *       already exists
     *
     * @async
     *
     * @param {LearningObjectID} id - database id of the record to change
     * @param {LearningObject} object - entity with values to update to
     */
    async editLearningObject(id: LearningObjectID, object: LearningObject): Promise<void> {
        return this.dataStore.editLearningObject(id, {
            name_: object.name,
            date: object.date,
            length_: object.length,
            goals: this.documentGoals(object.goals),
            repository: object.repository,
        });
    }

    /**
     * Update an existing learning object record.
     * NOTE: this is a deep update and as such somewhat expensive
     * NOTE: promise rejected if another learning object
     *       tied to the same author and with the same 'name' field
     *       already exists
     *
     * @async
     *
     * @param {LearningObjectID} id - database id of the record to change
     * @param {LearningObject} object - entity with values to update to
     */
    async updateLearningObject(id: LearningObjectID, object: LearningObject): Promise<void> {
        try {
            let toDelete = (await this.dataStore.fetchLearningObject(id)).outcomes;
            let doNotDelete = new Set<LearningOutcomeID>();

            await this.editLearningObject(id, object);
            for (let outcome of object.outcomes) {
                try {
                    let outcomeId = await this.dataStore.findLearningOutcome(id, outcome.tag);
                    doNotDelete.add(outcomeId);
                    await this.editLearningOutcome(outcomeId, outcome);
                } catch (e) {
                    // find operation failed; add it
                    await this.addLearningOutcome(id, outcome);
                }
            }

            // delete any learning outcomes not in the update object
            for (let outcomeId of toDelete) {
                if (!doNotDelete.has(outcomeId)) {
                    await this.dataStore.deleteLearningOutcome(outcomeId);
                }
            }
            this.responder.sendOperationSuccess();
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    }

    /**
     * Add a new user to the database.
     * NOTE: this function only adds basic fields;
     *       the outcome.mappings field is ignored
     *
     * @async
     *
     * @param {LearningObjectID} source - database id of the parent
     * @param {LearningOutcome} outcome - entity to add
     *
     * @returns {LearningOutcomeID} the database id of the new record
     */
    async addLearningOutcome(source: LearningObjectID, outcome: LearningOutcome): Promise<LearningOutcomeID> {
        return await this.dataStore.insertLearningOutcome({
            source: source,
            tag: outcome.tag,
            bloom: outcome.bloom,
            verb: outcome.verb,
            text: outcome.text,
            mappings: [],
            assessments: this.documentAssessments(outcome.assessments),
            strategies: this.documentInstructions(outcome.strategies),
        });
    }

    /**
     * Update an existing learning outcome.
     * NOTE: this function only updates basic fields;
     *       the outcome.mappings fields is ignored
     *
     * @async
     *
     * @param {LearningOutcomeID} id - database id of the record to change
     * @param {LearningOutcome} outcome - entity with values to update to
     */
    async editLearningOutcome(id: LearningOutcomeID, outcome: LearningOutcome): Promise<void> {
        return this.dataStore.editLearningOutcome(id, {
            bloom: outcome.bloom,
            verb: outcome.verb,
            text: outcome.text,
            assessments: this.documentAssessments(outcome.assessments),
            strategies: this.documentInstructions(outcome.strategies),
        });
    }
    async reorderOutcome(object: ObjectId, outcome: OutcomeID, index:number){
        try {
            await this.dataStore.reorderOutcome(object,outcome,index)
            this.responder.sendOperationSuccess();
        } catch (error) {
            this.responder.sendOperationError();
        }
    }
    
    async deleteLearningObject(id: LearningObjectID) : Promise<void>{
        try {
            await this.dataStore.deleteLearningObject(id);
            this.responder.sendOperationSuccess();
        } catch (error) {
            this.responder.sendOperationError(error);
        }
    }

    /**
     * Add a new standard outcome to the database.
     * @async
     *
     * @param {StandardOutcome} standard entity to add
     *
     * @returns {StandardOutcomeID} the database id of the new record
     */
    async addStandardOutcome(standard: StandardOutcome): Promise<StandardOutcomeID> {
        return this.dataStore.insertStandardOutcome({
            author: standard.author,
            name_: standard.name,
            date: standard.date,
            outcome: standard.outcome,
        });
    }

    /**
     * Return literally all objects. Very expensive.
     * @returns {LearningObject[]} array of literally all objects
     */
    async fetchAllObjects(): Promise<LearningObject[]> {
        try {
            let records = await this.dataStore.fetchAllObjects().toArray();
            let objects: LearningObject[] = [];
            for (let doc of records) {
                let authorRecord = await this.dataStore.fetchUser(doc.authorID);
                let author = new User(authorRecord.username, authorRecord.name_, null, null);
                let object = new LearningObject(author);
                object.name = doc.name_;
                object.date = doc.date;
                object.length = doc.length_;
                objects.push(object);
            }
            return Promise.resolve(objects);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * TODO: Refactor into fetchAllObjects. DRY
     * Returns array of learning objects associated with the given ids.
     * @returns {LearningObjectRecord[]}
     */
    async fetchMultipleObjects(ids: LearningObjectID[]): Promise<LearningObject[]> {
        try {
            let records: LearningObjectRecord[] = await this.dataStore.fetchMultipleObjects(ids).toArray();
            let objects: LearningObject[] = [];
            for (let doc of records) {
                let authorRecord = await this.dataStore.fetchUser(doc.authorID);
                let author = new User(authorRecord.username, authorRecord.name_, null, null);

                let object = new LearningObject(author);
                object.name = doc.name_;
                object.date = doc.date;
                object.length = doc.length_;
                objects.push(object);
            }
            return Promise.resolve(objects);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Search for objects by name, author, length, level, and content.
     * FIXME: implementation is rough and probably not as efficient as it could be
     *
     * @param {string} name the objects' names should closely relate
     * @param {string} author the objects' authors' names` should closely relate
     * @param {string} length the objects' lengths should match exactly
     * @param {string} level the objects' levels should match exactly TODO: implement
     * @param {string} content the objects' outcomes' outcomes should closely relate
     *
     * @returns {Outcome[]} list of outcome suggestions, ordered by score
     */
    async suggestObjects(name: string, author: string, length: string, level: string, content: string): Promise<void> {
        try {
            let objects: LearningObjectRecord[] = await this.dataStore.searchObjects(name, author, length, level, content);
            //FIXME: Suggestions should be typed as something like "ObjectSuggestion"
            let suggestions: any[] = [];
            for (let object of objects) {
                let owner = await this.dataStore.fetchUser(object.authorID);
                suggestions.push({
                    id: object._id,
                    author: owner.name_,
                    length: object.length_,
                    name: object.name_,
                    date: object.date,
                });
            }
            this.responder.sendObject(suggestions);
        } catch (e) {
            this.responder.sendOperationError(e);
        }
    }


    //////////////////////////////////////////
    // HELPER FUNCTIONS - not in public API //
    //////////////////////////////////////////

    /**
     * Convert a list of learning goals to an array of documents.
     * @param {LearningGoal[]} goals
     *
     * @returns {LearningGoalInterface[]}
     */
    private documentGoals(goals: LearningGoal[]): LearningGoalInterface[] {
        let array: LearningGoalInterface[] = [];
        for (let i = 0; i < goals.length; i++) {
            array.push({
                text: goals[i].text,
            });
        }
        return array;
    }

    /**
     * Convert a list of assessment plans to an array of documents.
     * @param {AssessmentPlan[]} goals
     *
     * @returns {AssessmentPlanInterface[]}
     */
    private documentAssessments(assessments: AssessmentPlan[]):
        AssessmentPlanInterface[] {
        let array: AssessmentPlanInterface[] = [];
        for (let i = 0; i < assessments.length; i++) {
            array.push({
                plan: assessments[i].plan,
                text: assessments[i].text,
            });
        }
        return array;
    }

    /**
     * Convert a list of instructional strategies to an array of documents.
     * @param {InstructionalStrategy[]} goals
     *
     * @returns {InstructionalStrategyInterface[]}
     */
    private documentInstructions(strategies: InstructionalStrategy[]):
        InstructionalStrategyInterface[] {
        let array: InstructionalStrategyInterface[] = [];
        for (let i = 0; i < strategies.length; i++) {
            array.push({
                instruction: strategies[i].instruction,
                text: strategies[i].text,
            });
        }
        return array;
    }

}
