// this script will pull data from BloominOnion app and insert it into our MongoDB

import * as lineReader from 'line-reader';

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';

import { DBGluer } from '../db.gluer';
import { UserID } from '../schema/schema';
import { User, LearningOutcome, LearningObject } from '../entity/entities';

const file = 'dbcontent/Dump20171010.dat';   // the data file

export async function fill(glue: DBGluer) {
    // first, add a 'legacy' user:
    let legacy = new User('legacy', 'Legacy User', null, 'legacy');
    let legacyid = await glue.addUser(legacy);

    lineReader.eachLine(file, (line, last) => {
        let dat = line.split('\t');

        if (dat.length === 5) {
            // alias dat data to row, to allow reuse of pull code
            let row = {
                learning_object_id: dat[0],
                name: dat[1],
                content: dat[2],
                userid: dat[3],
                createdate: dat[4],
            };

            let content = JSON.parse(row.content);
            // force conformation to schema
            if (content.mClass === '') content.mClass = 'nanomodule';
            if (content.mClass === 'Course (15 weeks)') content.mClass = 'Course';

            let object = legacy.addObject();
            // fill in all simple properties
            object.name = content.mName;

            for (let cGoal of content.goals) {
                let goal = object.addGoal();
                goal.text = cGoal.text;
            }

            // insert into database (also registers with user)
            glue.addLearningObject(legacyid, object)    // asynchronous
                .then((id) => {
                    // add all its outcomes
                    for (let cOutcome of content.outcomes) {
                        let outcome = object.addOutcome();
                        outcome.bloom = cOutcome.class;
                        outcome.verb = cOutcome.verb;
                        outcome.text = cOutcome.text;
                        for (let question of cOutcome.questions) {
                            let assessment = outcome.addAssessment();
                            assessment.plan = question.strategy;
                            assessment.text = question.text;
                        }
                        for (let instruction of cOutcome.instructionalstrategies) {
                            let strategy = outcome.addStrategy();
                            strategy.instruction = instruction.strategy;
                            strategy.text = instruction.text;
                        }
                        // insert the outcome (also registers with object)
                        glue.addLearningOutcome(id, outcome)    // asynchronous
                            .catch((err) => {
                                console.log('Failed to insert outcome: ' + err);
                            });
                    }
                }).catch((err) => {
                    console.log('Failed to insert object: ' + err);
                });
        } else {    // data formatting error
            console.log('Could not process line: ' + line);
        }
    });
    /* FIXME: adding the outcomes isn't necessarily done yet!!! */
    return Promise.resolve();
}

if (require.main === module) {
    // tslint:disable-next-line: no-require-imports
    require('../useme');

    let db: DBInterface = new MongoDriver();
    let hash: HashInterface = new BcryptDriver(10);
    let glue = new DBGluer(db, hash);

    db.connect(process.env.CLARK_DB_URI)
        .then(async () => {
            await fill(glue);
            db.disconnect();
        }).catch((err) => {
            console.log(err);
            db.disconnect();
        });
}
