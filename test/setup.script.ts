// tslint:disable-next-line: no-require-imports
require('../useme');

import { MongoClient } from 'mongodb';
import { init } from '../db-setup/db-setup.script';

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
} from 'clark-entity';

let db: DBInterface = new MongoDriver();
let hash: HashInterface = new BcryptDriver(10);
let glue = new DBGluer(db, hash);

MongoClient.connect(process.env.CLARK_DB_URI)
.then( async (rawdb) => {
    try {
        await init(rawdb);
        await rawdb.close();
        return Promise.resolve();
    } catch (e) {
        return Promise.reject(e);
    }
})
.then(async () => {
    try {
        await db.connect(process.env.CLARK_DB_URI);
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

        let melID = await addUser(
            'lisa',
            'Melisandre',
            'lisa@got.org',
            'thenightisdarkandfullofterrors',
        );

        await addUser(
            'will',
            'Will',
            'will@got.org',
            'pleasedontki',
        );

        let hoqID = await addUser(
            'tyrion',
            'Tyrion Lannister',
            'tyrion@got.org',
            'alwayspaydebts',
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
        let lordID = await addLearningObject(
            melID,
            'Red Priestess',
            [
                `Serve the Lord of Light`,
                `Serve the Prince who was Promised`,
            ],
        );
        let witchID = await addLearningObject(
            melID,
            'Shadowbinder',
            [
                `Um...this one was an accident, I'm pretty sure...`,
            ],
        );

        addLearningObject(
            hoqID,
            'Lecher',
            [
                'Drown your sorrows in wine and women',
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

        let fireID = await addLearningOutcome(
            lordID, 0,
            `Light infidels on fire`,
            [],
            [],
        );
        let preachID = await addLearningOutcome(
            lordID, 1,
            `Remind everyone the night is dark and full of terrors`,
            [],
            [],
        );
        let serveID = await addLearningOutcome(
            lordID, 2,
            `...pick a prince, any prince. You'll get it one of these times.`,
            [],
            [],
        );

        let demonID = await addLearningOutcome(
            witchID, 0,
            `Sleep with all the kings`,
            [],
            [],
        );
        let liveID = await addLearningOutcome(
            witchID, 1,
            `Live forever`,
            [],
            [],
        );

        console.log('Added test learning outcomes');

        // now map outcomes
        await mapOutcome(farmID, gotID);
        await mapOutcome(trainID, gotID);
        await mapOutcome(drinkID, gotID);
        await mapOutcome(farmID, provisionID);
        await mapOutcome(provisionID, garrisonID);
        await mapOutcome(wallID, garrisonID);

        console.log('Mapped test outcomes');


        db.disconnect();
        return Promise.resolve();
    } catch (e) {
        return Promise.reject(e);
    }
})
.catch( (e) => {
    console.log('SETUP FAILED: ' + e);
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
