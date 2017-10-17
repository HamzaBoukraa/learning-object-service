// this script pulls data from a tab-delimited two column file
//  treats the first column as the "criterion",
//  treats the second column as the "outcome",
//  and pushes each record to the Standard LO collection

import * as lineReader from 'line-reader';
import * as db from '../db.driver';
import * as glue from '../db.interactor';
import { StandardOutcome } from '../entity/outcome';

const file = "dbcontent/NIST.SP.800-181.dat";   // the data file

export async function NCWF() {
    let cnt = 0;    // track how many records we insert

    // what to do for each record
    lineReader.eachLine(file, function(line, last) {
        let dat = line.split('\t');
        if(dat.length == 2) {
            let outcome = new StandardOutcome("NCWF 2017", dat[0], dat[1]);
            glue.addStandardOutcome(outcome)   // asynchronous
                .catch((err)=>{console.log("Failed to insert: "+err)});
            cnt += 1;
        } else {    // data formatting error
            console.log("Could not process line: "+line);
        }

        // if we just processed the last line, exit gracefully
        if(last) {
            console.log("Added "+cnt+" records");
        }
    });

    return Promise.resolve();   // FIXME: adding the outcomes isn't necessarily done yet!!!
}

if (require.main === module) {
    db.connect()
      .then(async () => {
        await NCWF();
        db.disconnect();
      }).catch((err)=>{
        console.log(err);
        db.disconnect();
      });
}
