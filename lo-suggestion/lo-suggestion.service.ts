// tslint:disable-next-line: no-require-imports
require('../useme');

import * as server from 'socket.io';

import { DBInterface, HashInterface } from '../interfaces/interfaces';
import { MongoDriver, BcryptDriver } from '../drivers/drivers';

import { DBGluer } from '../db.gluer';
import { LearningObject, OutcomeSuggestion } from '../entity/entities';

const threshold = parseFloat(process.env.CLARK_LO_SUGGESTION_THRESHOLD);

/*
 * TODO: add logging, esp. for errors
 */

let db: DBInterface = new MongoDriver();
let hash: HashInterface = new BcryptDriver(10);
let glue = new DBGluer(db, hash);

db.connect(process.env.CLARK_DB_URI)
  .then(() => {
    let io = server.listen(process.env.CLARK_LO_SUGGESTION_PORT);
    console.log('Listening on port ' + process.env.CLARK_LO_SUGGESTION_PORT);

    io.on('connection', function (socket) {
      socket.on('suggestOutcomes',
                (text: string, filter: { [prop: string]: string }, ack: (err: string, res: OutcomeSuggestion[]) => void) => {
        glue.suggestOutcomes(text, 'text', threshold)
          .then((res) => {
            ack(null, res.filter((suggestion) => {
              for (let prop in filter) {
                if (suggestion[prop] && suggestion[prop].indexOf(filter[prop]) < 0) {
                  return false; // leave out suggestion if it doesn't contain filter text
                }
              }
              return true;
            }));
          })
          .catch((e) => {
            ack('Error suggesting outcomes: ' + e, null);
          });
      });

      socket.on('fetchAllObjects', (ack: (err: string, res: string[]) => void) => {
        glue.fetchAllObjects()
          .then((objects) => {
            ack(null, objects.map(LearningObject.serialize));
          })
          .catch((e) => {
            ack('Error fetching objects: ' + e, null);
          });
      });

      // socket.on('suggestOutcomes', (text: string, ack: (res:OutcomeSuggestion[])=>void) => {
      //     glue.suggestOutcomes(text, 'regex')
      //         .then((res)=>{ack(res)});
      // });

    });
  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  });
