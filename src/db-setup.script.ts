// this script runs each subscript needed to get the database to its initial state,
//  including collection initialization and initial data
import { MongoClient } from 'mongodb';
import * as db from './db.driver';

import { init } from './db-init.script';
import { NCWF } from './db-NCWF.script';
import { fill } from './db-fill.script';

import * as config from 'config';
let dbconfig = config.get('database');

// run initialization script
console.log("--- Initializing ---");
MongoClient.connect(dbconfig["uri"], async (err, dbase)=>{
    if(err) throw err;
    else {
        await init(dbase);
        dbase.close();

        db.connect()
          .then(()=>{
            console.log("--- Adding Standard Outcomes ---")
            NCWF().catch((err)=>{console.log("Failed to add outcomes: "+err)});

            console.log("--- Adding Legacy Objects ---")
            fill().catch((err)=>{console.log("Failed to add legacies: "+err)});
          }).catch((err)=>{
            console.log("Failed to connect: "+err);
          });
        
        setTimeout(db.disconnect, 3000);
    }
});