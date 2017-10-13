// this script pulls data from a tab-delimited two column file
//  treats the first column as the "criterion",
//  treats the second column as the "outcome",
//  and pushes each record to the Standard LO collection

import * as lineReader from 'line-reader';
import * as db from './db.driver';
import * as glue from './db.interactor';
import { StandardOutcome } from './outcome';

const file = "dbcontent/NIST.SP.800-181.dat";   // the data file

db.connect()
  .then( () => {
    let cnt = 0;    // track how many records we insert

    // what to do for each record
    lineReader.eachLine(file, async function(line, last) {
        let dat = line.split('\t');
        if(dat.length == 2) {
            try {
                let outcome = new StandardOutcome("NCWF 2017", dat[0], dat[1]);
                await glue.addStandardOutcome(outcome);
                cnt += 1;
            } catch(err) {  // database error
                console.log("Failed to insert: "+err);
            }
        } else {    // data formatting error
            console.log("Could not process line: "+line);
        }

        // if we just processed the last line, exit gracefully
        if(last) {
            db.disconnect();
            console.log("Added "+cnt+" records");
        }
    });
  })
  .catch((err)=>{
    console.log(err);
    db.disconnect();
  });
