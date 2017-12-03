// this script runs each subscript needed to get the database to its initial state,
//  including collection initialization and initial data

// tslint:disable-next-line: no-require-imports
require('../useme');

import { MongoClient } from 'mongodb';

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';

import { DBGluer } from '../db.gluer';

import { init } from './db-init.script';
import { NCWF } from './db-NCWF.script';
import { NCWFtasks } from './db-NCWF-tasks.script';
import { CAE } from './db-CAE.script';
import { CS2013 } from './db-CS2013.script';
import { fill } from './db-fill.script';

// run initialization script

console.log('--- Initializing ---');
MongoClient.connect(process.env.CLARK_DB_URI, async (err, dbase) => {
  if (err) throw err;
  else {
    await init(dbase);
    dbase.close();

    let db: DBInterface = new MongoDriver();
    let hash: HashInterface = new BcryptDriver(10);
    let glue = new DBGluer(db, hash);

    db.connect(process.env.CLARK_DB_URI)
      .then(() => {
        console.log('--- Adding Standard Outcomes ---');
        NCWF(glue).catch((e) => { console.log('Failed to add NCWF outcomes: ' + e); });
        NCWFtasks(glue).catch((e) => { console.log('Failed to add NCWF tasks: ' + e); });
        CAE(glue).catch((e) => { console.log('Failed to add CAE outcomes: ' + e); });
        CS2013(glue).catch((e) => { console.log('Failed to add CS2013 outcomes: ' + e); });

        console.log('--- Adding Legacy Objects ---');
        fill(glue).catch((e) => { console.log('Failed to add legacies: ' + e); });
      }).catch((e) => {
        console.log('Failed to connect: ' + e);
      });

    setTimeout(db.disconnect, 3000);
  }
});
