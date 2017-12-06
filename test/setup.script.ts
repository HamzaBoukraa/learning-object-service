// tslint:disable-next-line: no-require-imports
require('../useme');

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';
import { DBGluer } from '../db.gluer';

import { StandardOutcome, LearningObject, OutcomeSuggestion } from '../entity/entities';

let db: DBInterface = new MongoDriver();
let hash: HashInterface = new BcryptDriver(10);
let glue = new DBGluer(db, hash);

db.connect(process.env.CLARK_DB_URI).then(async () => {
    try {
        // start by defining and adding standard outcomes
        await glue.addStandardOutcome(new StandardOutcome('tester', 'test group 1', '2017', 'manage risk'));

        db.disconnect();
        console.log('Added initial records');
    } catch (e) {
        console.log('SETUP FAILED: ' + e);
    }
});
