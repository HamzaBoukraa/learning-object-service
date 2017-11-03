require('../useme');

import * as server from 'socket.io';

import * as db from '../db.driver';
import { Outcome } from '../entity/outcome';

export async function listen(port: number) {
    let io = server.listen(port);

    io.on('connection', function(socket) {
        // what to do when client sends learning outcome text
        socket.on('outcome', function(text) {
            let cursor = db.matchOutcomes(text);     // regex match
            
            let suggestions: Outcome[] = [];

            cursor.forEach((doc) => {
                /* FIXME: ^- this ensures weak results aren't
                    communicated, but I'd really like it to just
                    terminate the iteration. I think we need to use the
                    cursor's "hasNext" and "next" operations, but the
                    documentation is sloppy and I'm not sure how to. */
                
                suggestions.push({
                    author: doc.author,
                    name: doc.name_,
                    outcome: doc.outcome
                });
            }, (err) => {
                if(err) throw err;
                socket.emit('suggestion', suggestions);
            });
        });
    });
}

if (require.main === module) {
    db.connect()
      .then(() => {
        listen(3000);
        console.log("Listening on port "+3000);
      })
      .catch((err) => {
        console.log(err);
        db.disconnect();
      });
}
