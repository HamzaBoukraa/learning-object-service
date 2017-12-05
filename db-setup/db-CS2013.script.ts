// this script pulls data from a tab-delimited two column file
//  treats the first column as the 'name',
//  treats the second column as the 'outcome',
//  and pushes each record to the outcome collection, author 'CAE 2014'

// tslint:disable-next-line: no-require-imports
require('../useme');

import * as lineReader from 'line-reader';

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';

import { DBGluer } from '../db.gluer';
import { StandardOutcome } from '../entity/entities';

const file = 'dbcontent/CS_2013_Learning_Outcomes.dat';   // the data file

export async function CS2013(glue: DBGluer) {
    let cnt = 0;    // track how many records we insert

    // what to do for each record
    lineReader.eachLine(file, function (line, last) {
        let dat = line.split('\t');
        if (dat.length === 2) {
            let outcome = new StandardOutcome('CS 2013', dat[0], '2013', dat[1]);
            glue.addStandardOutcome(outcome)   // asynchronous
                .catch((err) => { console.log('Failed to insert: ' + err); });
            cnt += 1;
        } else {    // data formatting error
            console.log('Could not process line: ' + line);
        }

        // if we just processed the last line, exit gracefully
        if (last) {
            console.log('Added ' + cnt + ' CS 2013 learning outcomes');
        }
    });

    return Promise.resolve();   // FIXME: adding the outcomes isn't necessarily done yet!!!
}

if (require.main === module) {

    let db: DBInterface = new MongoDriver();
    let hash: HashInterface = new BcryptDriver(10);
    let glue = new DBGluer(db, hash);

    db.connect(process.env.CLARK_DB_URI)
        .then(async () => {
            await CS2013(glue);
            setTimeout(db.disconnect, 2000);
        }).catch((err) => {
            console.log(err);
            db.disconnect();
        });
}
