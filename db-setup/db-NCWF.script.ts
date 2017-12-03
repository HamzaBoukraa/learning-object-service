// this script pulls data from a tab-delimited two column file
//  treats the first column as the 'name',
//  treats the second column as the 'outcome',
//  and pushes each record to the outcome collection, author 'NCWF 2017'

import * as lineReader from 'line-reader';

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';

import { DBGluer } from '../db.gluer';
import { StandardOutcome } from '../entity/entities';

const file = 'dbcontent/NIST.SP.800-181.dat';   // the data file

export async function NCWF(glue: DBGluer) {
    let cnt = 0;    // track how many records we insert

    // what to do for each record
    lineReader.eachLine(file, function (line, last) {
        let dat = line.split('\t');
        if (dat.length === 2) {
            let outcome = new StandardOutcome('NCWF', dat[0], '2017', dat[1]);
            glue.addStandardOutcome(outcome)   // asynchronous
                .catch((err) => { console.log('Failed to insert: ' + err); });
            cnt += 1;
        } else {    // data formatting error
            console.log('Could not process line: ' + line);
        }

        // if we just processed the last line, exit gracefully
        if (last) {
            console.log('Added ' + cnt + ' NCWF KSA\'s as outcomes');
        }
    });

    return Promise.resolve();   // FIXME: adding the outcomes isn't necessarily done yet!!!
}

if (require.main === module) {
    // tslint:disable-next-line: no-require-imports
    require('../useme');

    let db: DBInterface = new MongoDriver();
    let hash: HashInterface = new BcryptDriver(10);
    let glue = new DBGluer(db, hash);

    db.connect(process.env.CLARK_DB_URI)
        .then(async () => {
            await NCWF(glue);
            setTimeout(db.disconnect, 2000);
        }).catch((err) => {
            console.log(err);
            db.disconnect();
        });
}
