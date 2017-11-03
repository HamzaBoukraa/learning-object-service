// this script runs each subscript needed to get the database to its initial state,
//  including collection initialization and initial data

require('../useme');

import { MongoClient } from 'mongodb';
import * as db from '../db.driver';

import { init } from './db-init.script';
import { NCWF } from './db-NCWF.script';
import { NCWFtasks } from './db-NCWF-tasks.script';
import { CAE } from './db-CAE.script';
import { CS2013 } from './db-CS2013.script';
import { fill } from './db-fill.script';

// run initialization script
if (!process.env["CLARK_DB"]) process.env["CLARK_DB"] = "localhost:27017";

console.log("--- Initializing ---");
MongoClient.connect("mongodb://"+process.env["CLARK_DB"]+"/onion", async (err, dbase)=>{
    if(err) throw err;
    else {
        await init(dbase);
        dbase.close();

        db.connect(process.env["CLARK_DB"])
          .then(()=>{
            console.log("--- Adding Standard Outcomes ---")
            NCWF().catch((err)=>{console.log("Failed to add NCWF outcomes: "+err)});
            NCWFtasks().catch((err)=>{console.log("Failed to add NCWF tasks: "+err)});
            CAE().catch((err)=>{console.log("Failed to add CAE outcomes: "+err)});
            CS2013().catch((err)=>{console.log("Failed to add CS2013 outcomes: "+err)});

            console.log("--- Adding Legacy Objects ---")
            fill().catch((err)=>{console.log("Failed to add legacies: "+err)});
          }).catch((err)=>{
            console.log("Failed to connect: "+err);
          });
        
        setTimeout(db.disconnect, 3000);
    }
});