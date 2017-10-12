// this script will pull data from BloominOnion app and insert it into our MongoDB

import { createConnection } from 'mysql';
import * as config from 'config';

import * as db from './db.driver';
import * as glue from './db.interactor';
import { UserID } from './db.schema';

import { User } from './user';
import { LearningObject } from './learning-object';
import { LearningOutcome } from './outcome';

var heroku = createConnection(config.get('heroku'));

db.connect()
  .then(()=>{
    heroku.connect();

    // let user information persist from user queries to object queries
    let userMap: {[mysqlid:string]:User} = {};
    let idMap: {[mysqlid:string]:UserID} = {};

    heroku.query('SELECT * FROM users')
        .on('error', (err) => {
            console.log("Problem with users query: "+err);
        })
        .on('fields', (fields) => {
            // TODO: I don't know what this event is but I doubt I need it
            //  leaving it in for now just in case I'm wrong, just until testing
        })
        .on('result', async (row) => {
            // build user
            userMap[row['userid']] = new User(row['username'], row['firstname']+" "+row['lastname']);
            // TODO: obviously the mongo user schema is presently incomplete
            // ex. mysql also has 'userpwd', 'email', and 'createdate'
            // and we never did decide to go with first and last name or not

            // insert user, remembering what mysql considers its id
            idMap[row['userid']] = await glue.addUser(userMap[row['userid']]);
        })
        .on('end', () => {
            heroku.query('SELECT * FROM learning_objects')
                .on('error', (err) => {
                    console.log("Problem with learning_objects query: "+err)
                })
                .on('result', async (row) => {
                    let content = JSON.parse(row['content']);
                    // TODO: the parsed content may or may not be escaped correctly
                    
                    let object = userMap[row['userid']].addObject();
                    // fill in all simple properties
                    object.name = content.mName;
                    object.length = content.mClass; // TODO: needs toLowerCase, or else change taxonomy
                    for ( let cGoal of content.goals ) {
                        let goal = object.addGoal();
                        goal.text = cGoal.text;
                    }
                    
                    // insert into database (also registers with user)
                    let id = await glue.addLearningObject(idMap[row['userid']], object);
                    
                    // add all its outcomes
                    for ( let cOutcome of content.outcomes ) {
                        let outcome = object.addOutcome();
                        outcome.bloom = cOutcome.class;
                        outcome.verb = cOutcome.verb;   // TODO: case concern
                        outcome.text = cOutcome.text;
                        for ( let question of cOutcome.questions ) {
                            let assessment = outcome.addAssessment();
                            assessment.plan = question.strategy;   // TODO: case concern
                            assessment.text = question.text;
                        }
                        for ( let instruction of cOutcome.instructionalstrategies ) {
                            let strategy = outcome.addStrategy();
                            strategy.instruction = instruction.strategy;   // TODO: case concern
                            strategy.text = instruction.text;
                        }
                        // insert the outcome (also registers with object)
                        await glue.addLearningOutcome(id, outcome);
                    }
                })
                .on('end', () => {
                    db.disconnect();
                })
        });
    
    heroku.end();   // automatically queued, will not end connection until query is buffered
  })
  .catch((err) => {
      console.log(err);
      db.disconnect();
  });