// this script will pull data from BloominOnion app and insert it into our MongoDB

import * as lineReader from 'line-reader';

import * as db from './db.driver';
import * as glue from './db.interactor';
import { UserID } from './db.schema';

import { User } from './user';
import { LearningObject } from './learning-object';
import { LearningOutcome } from './outcome';

const file = "dbcontent/Dump20171010.dat";   // the data file

export async function fill() {
    // first, add a 'legacy' user:
    let legacy = new User('legacy', 'Legacy User');
    let legacyid = await glue.addUser(legacy);

    lineReader.eachLine(file, (line, last) => {
        let dat = line.split('\t');

        if(dat.length == 5) {
            // alias dat data to row, to allow reuse of pull code
            let row = {
                learning_object_id: dat[0],
                name: dat[1],
                content: dat[2],
                userid: dat[3],
                createdate: dat[4]
            }

            let content = JSON.parse(row['content']);
            // force conformation to schema
            if (content.mClass === '') content.mClass = 'nanomodule';
            if (content.mClass === 'Course (15 weeks)') content.mClass = 'course';
            
            let object = legacy.addObject();
            // fill in all simple properties
            object.name = content.mName;
            object.length = content.mClass.toLowerCase();

            for ( let cGoal of content.goals ) {
                let goal = object.addGoal();
                goal.text = cGoal.text;
            }
            
            // insert into database (also registers with user)
            glue.addLearningObject(legacyid, object)    // asynchronous
                .then((id) => {
                    // add all its outcomes
                    for ( let cOutcome of content.outcomes ) {
                        let outcome = object.addOutcome();
                        outcome.bloom = cOutcome.class;
                        outcome.verb = cOutcome.verb.toLowerCase();
                        outcome.text = cOutcome.text;
                        for ( let question of cOutcome.questions ) {
                            let assessment = outcome.addAssessment();
                            assessment.plan = question.strategy.toLowerCase();
                            assessment.text = question.text;
                        }
                        for ( let instruction of cOutcome.instructionalstrategies ) {
                            let strategy = outcome.addStrategy();
                            strategy.instruction = instruction.strategy.toLowerCase();
                            strategy.text = instruction.text;
                        }
                        // insert the outcome (also registers with object)
                        glue.addLearningOutcome(id, outcome)    // asynchronous
                            .catch((err) => {
                                console.log("Failed to insert outcome: "+err);
                            });
                    }
                }).catch((err) => {
                    console.log("Failed to insert object: "+err);
                });
        } else {    // data formatting error
            console.log("Could not process line: "+line);
        }
    });
    return Promise.resolve();   // FIXME: adding the outcomes isn't necessarily done yet!!!
}

if (require.main === module) {
    db.connect()
      .then(async () => {
        await fill();
        db.disconnect();
      }).catch((err)=>{
        console.log(err);
        db.disconnect();
      });
}
