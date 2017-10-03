// this script pulls data from a tab-delimited two column file
//  treats the first column as the "criterion",
//  treats the second column as the "outcome",
//  and pushes each record to the Standard LO collection

const lineReader = require('line-reader');
const db = require('./db.driver');

var file = "accreditation/NIST.SP.800-181.dat";   // the data file

db.connect((err) => {
    if(err) throw err;

    let cnt = 0;    // track how many records we insert

    // what to do for each record
    lineReader.eachLine(file, function(line, last) {
        let dat = line.split('\t');
        if(dat.length == 2) {
            try {
                db.insert('standardLO', {
                    criterion: dat[0],
                    outcome: dat[1]
                });
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
});
