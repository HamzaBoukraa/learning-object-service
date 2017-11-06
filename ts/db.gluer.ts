/**
 * Provide functions for interaction between entities and database.
 */

import assertNever from 'assert-never';

import * as db from './db.driver';

import {
    UserID, LearningObjectID, LearningOutcomeID, StandardOutcomeID
} from './schema/db.schema';
import { LearningGoalInterface } from './schema/learning-object.schema';
import {
    AssessmentPlanInterface, InstructionalStrategyInterface
} from './schema/learning-outcome.schema';

import { User } from './entity/user';
import { LearningObject } from './entity/learning-object';
import { Outcome, StandardOutcome, LearningOutcome } from './entity/outcome';
import { LearningGoal } from './entity/learning-goal';
import { AssessmentPlan } from './entity/assessment-plan';
import { InstructionalStrategy } from './entity/instructional-strategy';

/**
 * Load a user and the scalar fields of its objects.
 * @async
 * 
 * @param {string} userid the user's login id
 * 
 * @returns {User}
 */
export async function loadUser(userid: string): Promise<User> {
    try {
        let id = await db.findUser(userid);
        let record = await db.fetchUser(id);
        
        let user = new User(record.id, record.name_);
        for ( let objectid of record.objects ) {
            let objectRecord = await db.fetchLearningObject(objectid);
            let object = user.addObject();
            object.name = objectRecord.name_;
            object.length = objectRecord.length_;
            // not a deep operation - ignore goals and outcomes
        }

        return Promise.resolve(user);
    } catch(e) {
        return Promise.reject(e);
    }
}

/**
 * Load a learning object and all its learning outcomes.
 * @async
 * 
 * @param {UserID} author the author's database id
 * @param {string} name the learning object's identifying string
 * 
 * @returns {LearningObject}
 */
export async function loadLearningObject(author: UserID, name: string):
        Promise<LearningObject> {
    try {
        let id = await db.findLearningObject(author, name);
        let record = await db.fetchLearningObject(id);

        // no real need to link to User object, so pass null
        let object = new LearningObject(null);
        object.name = record.name_;
        object.length = record.length_;
        for (let rGoal of record.goals ) {
            let goal = object.addGoal();
            goal.text = rGoal.text;
        }

        // load each outcome
        for ( let outcomeid of record.outcomes ) {
            let rOutcome = await db.fetchLearningOutcome(outcomeid);

            let outcome = object.addOutcome();
            outcome.bloom = rOutcome.bloom;
            outcome.verb = rOutcome.verb;
            outcome.text = rOutcome.text;
            for ( let rAssessment of rOutcome.assessments ) {
                let assessment = outcome.addAssessment();
                assessment.plan = rAssessment.plan;
                assessment.text = rAssessment.text;
            }
            for ( let rStrategy of rOutcome.strategies ) {
                let strategy = outcome.addStrategy();
                strategy.instruction = rStrategy.instruction;
                strategy.text = rStrategy.text;
            }

            // only extract the basic info for each mapped outcome
            for ( let mapid of rOutcome.mappings ) {
                let rMapping = await db.fetchOutcome(mapid);
                outcome.mapTo({
                    author: rMapping.author,
                    name: rMapping.name_,
                    outcome: rMapping.outcome
                });
            }
        }

        return Promise.resolve(object);
    } catch(e) {
        return Promise.reject(e);
    }
}

/**
 * Add a new user to the database.
 * NOTE: this function only adds basic fields;
 *       the user.objects field is ignored
 * NOTE: promise rejected if another user with
 *       the same 'id' field already exists
 * 
 * @async
 * 
 * @param {User} user - entity to add
 * 
 * @returns {UserID} the database id of the new record
 */
export async function addUser(user: User): Promise<UserID> {
    return db.insertUser({
        id: user.id,
        name_: user.name,
        objects: []
    });
}

/**
 * Update an existing user record.
 * NOTE: this function only updates basic fields;
 *       the user.objects fields is ignored
 * NOTE: promise rejected if another user with
 *       the same 'id' field already exists
 * 
 * @async
 * 
 * @param {UserID} id - database id of the record to change
 * @param {User} user - entity with values to update to
 */
export async function editUser(id: UserID, user: User): Promise<void> {
    return db.editUser(id, {
        id: user.id,
        name_: user.name
    });
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
export async function addLearningObject(author: UserID,
        object: LearningObject): Promise<LearningObjectID> {
    return await db.insertLearningObject({
        author: author,
        name_: object.name,
        length_: object.length,
        goals: documentGoals(object.goals),
        outcomes: []
    });
}

/**
 * Update an existing user record.
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
export async function editLearningObject(id: LearningObjectID, object: LearningObject):
        Promise<void> {
    return db.editLearningObject(id, {
        name_: object.name,
        length_: object.length,
        goals: documentGoals(object.goals),
    });
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
export async function addLearningOutcome(source: LearningObjectID,
        outcome: LearningOutcome): Promise<LearningOutcomeID> {
    return await db.insertLearningOutcome({
        source: source,
        bloom: outcome.bloom,
        verb: outcome.verb,
        text: outcome.text,
        mappings: [],
        assessments: documentAssessments(outcome.assessments),
        strategies: documentInstructions(outcome.strategies)
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
export async function editLearningOutcome(id: LearningOutcomeID,
        outcome: LearningOutcome): Promise<void> {
    return db.editLearningOutcome(id, {
        bloom: outcome.bloom,
        verb: outcome.verb,
        text: outcome.text,
        assessments: documentAssessments(outcome.assessments),
        strategies: documentInstructions(outcome.strategies)
    });
}

/**
 * Add a new standard outcome to the database.
 * @async
 * 
 * @param {StandardOutcome} standard entity to add
 * 
 * @returns {StandardOutcomeID} the database id of the new record
 */
export async function addStandardOutcome(standard: StandardOutcome):
        Promise<StandardOutcomeID> {
    return db.insertStandardOutcome({
        author: standard.author,
        name_: standard.name,
        outcome: standard.outcome
    });
}

export type suggestMode = "text" | "regex";

/**
 * Search for outcomes related to a given text string.
 * 
 * FIXME: We may want to transform this into a streaming algorithm,
 *       rather than waiting for schema -> entity conversion
 *       for the entire list. I don't know if there's a good way
 *       to do that, but the terms 'Buffer' and 'Readable' seem
 *       vaguely promising.
 * 
 * @param {string} text the words to search for
 * @param {suggestMode} mode which suggestion mode to use:
 *      "text" - uses mongo's native text search query
 *      "regex" - matches outcomes containing each word in text
 * @param {number} threshold minimum score to include in results
 *      (ignored if mode is "regex")
 * 
 * @returns {Outcome[]} list of outcome suggestions, ordered by score
 */
export async function suggestOutcomes(text: string, mode:suggestMode="text",
        threshold=0): Promise<Outcome[]> {
    try {
        let suggestions: Outcome[] = [];
        
        let cursor;
        switch(mode) {
            case "text": cursor = db.searchOutcomes(text);break;
            case "regex": cursor = db.matchOutcomes(text);break;
            default: return assertNever(mode);
        }

        while (await cursor.hasNext()) {
            let doc = await cursor.next();
            
            // terminate iteration once scores are lower than threshold
            if (typeof doc.score !== undefined && doc.score < threshold) break;

            suggestions.push({
               author: doc.author,
               name: doc.name_,
               outcome: doc.outcome
            });
        }

        return Promise.resolve(suggestions);
    } catch(e) {
        return Promise.reject(e);
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
function documentGoals(goals: LearningGoal[]): LearningGoalInterface[] {
    let array: LearningGoalInterface[] = [];
    for(let i = 0; i < goals.length; i ++) {
        array.push({
            text: goals[i].text
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
function documentAssessments(assessments: AssessmentPlan[]):
        AssessmentPlanInterface[] {
    let array: AssessmentPlanInterface[] = [];
    for(let i = 0; i < assessments.length; i ++) {
        array.push({
            plan: assessments[i].plan,
            text: assessments[i].text
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
function documentInstructions(strategies: InstructionalStrategy[]):
        InstructionalStrategyInterface[] {
    let array: InstructionalStrategyInterface[] = [];
    for(let i = 0; i < strategies.length; i ++) {
        array.push({
            instruction: strategies[i].instruction,
            text: strategies[i].text
        });
    }
    return array;
}
