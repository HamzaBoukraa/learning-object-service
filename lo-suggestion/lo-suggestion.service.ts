require('../useme');

import * as server from 'socket.io';

import * as db from '../db.driver';
import * as glue from '../db.gluer';

import { OutcomeSuggestion } from '../entity/entities';

const threshold = parseFloat(process.env["CLARK_LO_SUGGESTION_THRESHOLD"]);

db.connect(process.env["CLARK_DB_URI"])
  .then(() => {
    let io = server.listen(process.env["CLARK_LO_SUGGESTION_PORT"]);
    console.log("Listening on port "+process.env["CLARK_LO_SUGGESTION_PORT"]);

    io.on('connection', function(socket) {

        socket.on('suggestOutcomes', (text: string, ack: (res:OutcomeSuggestion[])=>void) => {
            glue.suggestOutcomes(text, "text", threshold)
                .then((res)=>{ack(res)});
        });

        // socket.on('suggestOutcomes', (text: string, ack: (res:OutcomeSuggestion[])=>void) => {
        //     glue.suggestOutcomes(text, "regex")
        //         .then((res)=>{ack(res)});
        // });

    });
  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  });
