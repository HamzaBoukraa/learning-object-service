// this script pulls data from a tab-delimited two column file
//  treats the first column as the "name",
//  treats the second column as the "outcome",
//  and pushes each record to the outcome collection, author "NCWF 2017"

require('../useme');

import * as lineReader from 'line-reader';
import * as db from '../db.driver';
import * as glue from '../db.gluer';
import { StandardOutcome } from '../entity/outcome';

const file = "dbcontent/NIST.SP.800-181.tasks.dat";   // the data file

export async function NCWFtasks() {
    let cnt = 0;    // track how many records we insert

    // what to do for each record
    lineReader.eachLine(file, function(line, last) {
        let dat = line.split('\t');
        if(dat.length == 2) {
            let outcome = new StandardOutcome("NCWF 2017 Tasks", dat[0], dat[1]);
            glue.addStandardOutcome(outcome)   // asynchronous
                .catch((err)=>{console.log("Failed to insert: "+err)});
            cnt += 1;
        } else {    // data formatting error
            console.log("Could not process line: "+line);
        }

        // if we just processed the last line, exit gracefully
        if(last) {
            console.log("Added "+cnt+" NCWF tasks as outcomes");
        }
    });

    return Promise.resolve();   // FIXME: adding the outcomes isn't necessarily done yet!!!
}

if (require.main === module) {
    if (!process.env["CLARK_DB"]) process.env["CLARK_DB"] = "localhost:27017";
    db.connect(process.env["CLARK_DB"])
      .then(async () => {
        await NCWFtasks();
        setTimeout(db.disconnect, 2000);
      }).catch((err)=>{
        console.log(err);
        db.disconnect();
      });
}
