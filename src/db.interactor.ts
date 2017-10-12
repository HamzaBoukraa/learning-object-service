import * as db from './db.driver';

import { RecordID, UserID, LearningObjectID, OutcomeID, LearningOutcomeID, StandardOutcomeID } from './db.schema';
import { Record, Update, Insert } from './db.schema';
import { collections, collectionFor, foreignData } from './db.schema';
import { autosFor, fixedsFor, foreignsFor, fieldsFor } from './db.schema';

import { UserSchema, UserRecord, UserUpdate, UserInsert } from './user.schema';
import { LearningObjectSchema, LearningObjectRecord, LearningObjectUpdate, LearningObjectInsert } from './learning-object.schema';
import { LearningGoalInterface } from './learning-object.schema';
import { LearningOutcomeSchema, LearningOutcomeRecord, LearningOutcomeUpdate, LearningOutcomeInsert } from './learning-outcome.schema';
import { AssessmentPlanInterface, InstructionalStrategyInterface } from './learning-outcome.schema';
import { StandardOutcomeSchema, StandardOutcomeRecord, StandardOutcomeUpdate, StandardOutcomeInsert } from './standard-outcome.schema';

import { User } from './user';
import { LearningObject } from './learning-object';
import { Outcome, StandardOutcome, LearningOutcome } from './outcome';
import { LearningGoal } from './learning-goal';
import { AssessmentPlan } from './assessment-plan';
import { InstructionalStrategy } from './instructional-strategy';

/**
 * Create a new user record in the database.
 * This function, as with all 'add' functions, will not add non-critical
 *  references. ie. the user.objects field is ignored.
 * This function will fail if a user with the same user.id already exists.
 * @param user - entity to add
 * @returns a promise containing the database ID of the new record
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
 * This function, as with all 'edit' functions, will not change any
 *  references. ie. the user.objects field will be ignored.
 * This function will fail if no user with the given id exists.
 * @param id - database _id of record to update
 * @param user - entity to update to
 */
export async function editUser(id: UserID, user: User): Promise<void> {
    return db.editUser(id, {
        id: user.id,
        name_: user.name
    });
}

export async function addLearningObject(author: UserID, object: LearningObject): Promise<LearningObjectID> {
    return await db.insertLearningObject({
        author: author,
        name_: object.name,
        length_: object.length,
        goals: documentGoals(object.goals),
        outcomes: []
    });
}

export async function editObject(id: LearningObjectID, object: LearningObject): Promise<void> {
    return db.editLearningObject(id, {
        name_: object.name,
        length_: object.length,
        goals: documentGoals(object.goals),
    });
}

export async function addLearningOutcome(source: LearningObjectID, outcome: LearningOutcome): Promise<LearningOutcomeID> {
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

export async function editLearningOutcome(id: LearningOutcomeID, outcome: LearningOutcome): Promise<void> {
    return db.editLearningOutcome(id, {
        bloom: outcome.bloom,
        verb: outcome.verb,
        text: outcome.text,
        assessments: documentAssessments(outcome.assessments),
        strategies: documentInstructions(outcome.strategies)
    });
}

export async function addStandardOutcome(outcome: StandardOutcome) {
    return db.insertStandardOutcome({
        author: outcome.author,
        name_: outcome.name,
        text: outcome.text
    });
}













function documentGoals(goals: LearningGoal[]): LearningGoalInterface[] {
    let array: LearningGoalInterface[] = [];
    for(let i = 0; i < goals.length; i ++) {
        array.push({
            text: goals[i].text
        });
    }
    return array;
}

function documentAssessments(assessments: AssessmentPlan[]): AssessmentPlanInterface[] {
    let array: AssessmentPlanInterface[] = [];
    for(let i = 0; i < assessments.length; i ++) {
        array.push({
            plan: assessments[i].plan,
            text: assessments[i].text
        });
    }
    return array;
}

function documentInstructions(strategies: InstructionalStrategy[]): InstructionalStrategyInterface[] {
    let array: InstructionalStrategyInterface[] = [];
    for(let i = 0; i < strategies.length; i ++) {
        array.push({
            instruction: strategies[i].instruction,
            text: strategies[i].text
        });
    }
    return array;
}
