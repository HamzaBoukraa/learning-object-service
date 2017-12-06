// tslint:disable-next-line: no-require-imports
require('../useme');

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';
import { DBGluer } from '../db.gluer';

import {
    StandardOutcome,
    User,
    LearningObject,
    LearningOutcome,
    AssessmentPlan,
    InstructionalStrategy,
} from '../entity/entities';

let db: DBInterface = new MongoDriver();
let hash: HashInterface = new BcryptDriver(10);
let glue = new DBGluer(db, hash);

db.connect(process.env.CLARK_DB_URI).then(async () => {
    try {
        // add standard outcomes
        let gotID = await addStandardOutcome(
            'got.org',
            'GoT Survival Tips',
            '2017',
            `Don't die.`,
        );
        console.log('Added test standard outcomes');

        // now add users
        let nedID = await addUser(
            'ned',
            'Eddard Stark',
            'ned@got.org',
            'winteriscoming',
        );

        let jonID = await addUser(
            'jsnow',
            'Jon Snow',
            'jsnow@got.org',
            'thedeadwalk',
        );

        let bobID = await addUser(
            'markaddy',
            'Robert Baratheon',
            'markaddy@got.org',
            'burnthemall',
        );

        console.log('Added test users');

        // now add objects
        let starkID = await addLearningObject(
            nedID,
            'Warden of the North',
            [
                `Prepare for Winter`,
            ],
        );
        let handID = await addLearningObject(
            nedID,
            'Hand of the King',
            [
                `Ensure the Kingdom doesn't fall apart`,
                `Keep the King from embarrassing himself`,
            ],
        );
        let crowID = await addLearningObject(
            jonID,
            'Night\'s Watch',
            [
                `Keep what's north of the wall, north of the wall`,
            ],
        );
        let throneID = await addLearningObject(
            bobID,
            'King of the Andals',
            [
                `Good question`,
            ],
        );

        console.log('Added test learning objects');

        // now add outcomes
        let farmID = await addLearningOutcome(
            starkID, 0,
            `Farm lots of food`,
            [],
            [],
        );
        let provisionID = await addLearningOutcome(
            starkID, 1,
            `Provision the Night's Watch`,
            [],
            [],
        );
        let wallID = await addLearningOutcome(
            starkID, 2,
            `Repair the Wall`,
            [],
            [],
        );

        let councilID = await addLearningOutcome(
            handID, 0,
            `Sit on the council`,
            [],
            [],
        );
        let meanID = await addLearningOutcome(
            handID, 1,
            `Intimidate all who would oppose the King`,
            [],
            [],
        );
        let adviseID = await addLearningOutcome(
            handID, 2,
            `Advise the King`,
            [],
            [],
        );

        let huntID = await addLearningOutcome(
            crowID, 0,
            `Hunt wildlings`,
            [],
            [],
        );
        let garrisonID = await addLearningOutcome(
            crowID, 1,
            `Garrison the castles along the wall`,
            [],
            [],
        );
        let trainID = await addLearningOutcome(
            crowID, 2,
            `Train for battle`,
            [],
            [],
        );

        let eatID = await addLearningOutcome(
            throneID, 0,
            `Pig out on all the foods`,
            [],
            [],
        );
        let drinkID = await addLearningOutcome(
            throneID, 1,
            `DON'T DRINK THE WINE!`,
            [],
            [],
        );
        let bemerryID = await addLearningOutcome(
            throneID, 2,
            `Sleep with all the womens`,
            [],
            [],
        );

        console.log('Added test learning outcomes');

        // now map outcomes
        mapOutcome(farmID, gotID);
        mapOutcome(trainID, gotID);
        mapOutcome(drinkID, gotID);
        mapOutcome(farmID, provisionID);
        mapOutcome(provisionID, garrisonID);
        mapOutcome(wallID, garrisonID);

        console.log('Mapped test outcomes');


        db.disconnect();
    } catch (e) {
        console.log('SETUP FAILED: ' + e);
    }
});



// helper methods
async function addStandardOutcome(author: string, name: string, date: string, outcome: string) {
    return glue.addStandardOutcome(new StandardOutcome(author, name, date, outcome));
}

async function addUser(id: string, name: string, email: string, pwd: string) {
    return glue.addUser(new User(id, name, email, pwd));
}

async function addLearningObject(uid: any, name: string, goals: string[]) {
    let object = new LearningObject(null, name);
    for (let text of goals) {
        let goal = object.addGoal();
        goal.text = text;
    }

    return glue.addLearningObject(uid, object);
}

async function addLearningOutcome(obid: any, tag: number, text: string, tests: string[], courses: string[]) {
    let assessments: AssessmentPlan[] = [];
    for (let text_ of tests) {
        let test = new AssessmentPlan(null);
        test.text = text_;
    }

    let strategies: InstructionalStrategy[] = [];
    for (let text_ of courses) {
        let course = new InstructionalStrategy(null);
        course.text = text_;
    }

    let outcome = LearningOutcome.unserialize(JSON.stringify({
        tag: tag,
        bloom: 'Remember and Understand',
        verb: 'Define',
        text: text,
        mappings: null,
        assessments: assessments.map(AssessmentPlan.serialize),
        strategies: strategies.map(InstructionalStrategy.serialize),
    }),                                       null);

    return glue.addLearningOutcome(obid, outcome);
}

async function mapOutcome(id: any, to: any) {
    return db.mapOutcome(id, to);
}
