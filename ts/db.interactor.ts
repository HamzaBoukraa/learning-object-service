/**
 * Provide functions for interaction between entities and database.
 */

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
import { StandardOutcome, LearningOutcome } from './entity/outcome';
import { LearningGoal } from './entity/learning-goal';
import { AssessmentPlan } from './entity/assessment-plan';
import { InstructionalStrategy } from './entity/instructional-strategy';

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
export async function editObject(id: LearningObjectID, object: LearningObject):
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
