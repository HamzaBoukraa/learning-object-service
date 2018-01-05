// tslint:disable-next-line: no-require-imports
require('../useme');

import * as express from 'express';
// tslint:disable-next-line: no-require-imports
const bodyParser = require('body-parser');

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';

import { DBGluer } from '../db.gluer';
import { LearningObject, OutcomeSuggestion } from '../entity/entities';

const threshold = parseFloat(process.env.CLARK_LO_SUGGESTION_THRESHOLD);

const server = express();
server.use(bodyParser.json());

/*
 * TODO: add logging, esp. for errors
 */

let db: DBInterface = new MongoDriver();
let hash: HashInterface = new BcryptDriver(10);
let glue = new DBGluer(db, hash);

db.connect(process.env.CLARK_DB_URI)
  .then(() => {
    server.post('/suggestOutcomes', (req, res) => {
      let text = req.body.text;
      let filter = req.body.filter;

      glue.suggestOutcomes(text, 'regex', threshold)
        .then((outcomes) => {
          res.json(
            outcomes.filter((suggestion) => {
              for (let prop in filter) {
                if (suggestion[prop] && suggestion[prop].indexOf(filter[prop]) < 0) {
                  return false; // leave out suggestion if it doesn't contain filter text
                }
              }
              return true;
            }));
        })
        .catch((err) => { res.json({ error: err }); });
    });

    server.post('/fetchAllObjects', (req, res) => {
      glue.fetchAllObjects()
        .then((objects) => { res.json(objects.map(LearningObject.serialize)); })
        .catch((err) => { res.json({ error: err }); });
    });

    server.listen(process.env.CLARK_LO_SUGGESTION_PORT);
    console.log('Listening on port ' + process.env.CLARK_LO_SUGGESTION_PORT);
  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  });
