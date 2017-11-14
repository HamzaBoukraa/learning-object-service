/**
 * Provide functions for interaction between entities and database.
 */

import assertNever from 'assert-never';

import { hash, verify } from './hash.driver';

import * as db from './db.driver';

import {
    UserID, LearningObjectID, OutcomeID, LearningOutcomeID, StandardOutcomeID,
    AssessmentPlanInterface, InstructionalStrategyInterface, LearningGoalInterface
} from './schema/schema';

import {
    User, LearningObject,
    Outcome, OutcomeSuggestion, StandardOutcome, LearningOutcome,
    LearningGoal, AssessmentPlan, InstructionalStrategy
} from './entity/entities';


/**
 * Check if a user has provided the correct password.
 * NOTE: Promise is rejected if user does not exist.
 * 
 * @param {string} userid the user's login id
 * @param {string} pwd the user's login password
 * 
 * @returns {boolean} true iff userid/pwd pair is valid
 */
export async function authenticate(userid: string, pwd: string): Promise<boolean> {
    try {
        let id = await db.findUser(userid);
        let record = await db.fetchUser(id);
        return verify(pwd, record.pwdhash);
    } catch(e) {
        return Promise.reject(e);
    }
}

/**
 * Load a user's scalar fields (ignore objects).
 * NOTE: this also ignores password
 * @async
 * 
 * @param {string} userid the user's login id
 * 
 * @returns {User}
 */
export async function loadUser(id: UserID): Promise<User> {
    try {
        let record = await db.fetchUser(id);
        
        let user = new User(record.id, record.name_, record.email, null);
        // not a deep operation - ignore objects

        return Promise.resolve(user);
    } catch(e) {
        return Promise.reject(e);
    }
}

/**
 * Load the scalar fields of a user's objects (ignore goals and outcomes).
 * @async
 * 
 * @param {string} userid the user's login id
 * 
 * @returns {User}
 */
export async function loadLearningObjectSummary(id: UserID): Promise<LearningObject[]> {
    try {
        let record = await db.fetchUser(id);
        
        let summary: LearningObject[] = [];
        for ( let objectid of record.objects ) {
            let objectRecord = await db.fetchLearningObject(objectid);
            let object = new LearningObject(null);
            object.name = objectRecord.name_;
            object.length = objectRecord.length_;
            // not a deep operation - ignore goals and outcomes
            summary.push(object);
        }

        return Promise.resolve(summary);
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
export async function loadLearningObject(id: LearningObjectID):
        Promise<LearningObject> {
    try {
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
                    date: rMapping.date,
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
    let pwdhash = await hash(user.pwd);
    return db.insertUser({
        id: user.id,
        name_: user.name,
        email: user.email,
        pwdhash: pwdhash,
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
    let edit = {
        id: user.id,
        name_: user.name,
        email: user.email,
        pwdhash: ""
    };

    if (user.pwd) edit.pwdhash = await hash(user.pwd);
    else { delete edit.pwdhash; }
    /*
     * FIXME: The UserEdit argument to db.editUser requires a pwdhash,
     *       but unless user is explicitly changing password, user
     *       object won't have pwd set. The current solution tricks tsc
     *       into THINKING edit implements UserEdit, but then deletes
     *       pwdhash. The only reason this may be bad is that a more
     *       sophisticated future tsc version may notice the trick, and
     *       refuse to compile. The alternative is to look up the
     *       current pwdhash via a call to db.fetchUser. That's extra
     *       database strain, so we should only do that if tsc ever
     *       gets wise to our trick.
     */
    return db.editUser(id, edit);
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
        date: object.date,
        length_: object.length,
        goals: documentGoals(object.goals),
        outcomes: []
    });
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
export async function editLearningObject(id: LearningObjectID, object: LearningObject):
        Promise<void> {
    return db.editLearningObject(id, {
        name_: object.name,
        date: object.date,
        length_: object.length,
        goals: documentGoals(object.goals),
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
export async function updateLearningObject(id: LearningObjectID, object: LearningObject):
        Promise<void> {
    try {
        let toDelete = (await db.fetchLearningObject(id)).outcomes;
        let doNotDelete = new Set<LearningOutcomeID>();

        await editLearningObject(id, object);
        for (let outcome of object.outcomes) {
            try {
                let outcomeId = await db.findLearningOutcome(id, outcome.tag);
                doNotDelete.add(outcomeId)
                await editLearningOutcome(outcomeId, outcome);
            } catch (e) {
                // find operation failed; add it
                await addLearningOutcome(id, outcome);
            }
        }

        // delete any learning outcomes not in the update object
        for (let outcomeId of toDelete) {
            if (!doNotDelete.has(outcomeId)) {
                await db.deleteLearningOutcome(outcomeId);
            }
        }

    } catch(e) {
        return Promise.reject(e);
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
export async function addLearningOutcome(source: LearningObjectID,
        outcome: LearningOutcome): Promise<LearningOutcomeID> {
    return await db.insertLearningOutcome({
        source: source,
        tag: outcome.tag,
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
        date: standard.date,
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
        threshold=0): Promise<OutcomeSuggestion[]> {
    try {
        let suggestions: OutcomeSuggestion[] = [];
        
        let cursor;
        switch(mode) {
            case "text":
                cursor = db.searchOutcomes(text)
                           .sort( { score: {$meta: "textScore"} } );
                break;
            case "regex": cursor = db.matchOutcomes(text);break;
            default: return assertNever(mode);
        }

        while (await cursor.hasNext()) {
            let doc = await cursor.next();
            let suggestion = {
                id: doc._id,
                author: doc.author,
                name: doc.name_,
                date: doc.date,
                outcome: doc.outcome
             }
            
            // if mode provides scoring information
            if (doc["score"] !== undefined) {
                let score = doc["score"];

                // skip record if score is lower than threshold
                if (score < threshold) break;

                /*
                 * TODO: Look into sorting options. An streaming insert
                 *       sort here may be better than mongo's,
                 *       if such a thing is possible
                 * In that case, switch break above to continue.
                 */

            }

            suggestions.push(suggestion);
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
