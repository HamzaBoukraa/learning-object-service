const app = require('express')()
const http = require('http').Server(app);
// TODO: ^- I don't know if we really need express to initialize http..?
// var io = require('socket.io')(http);
// I'm also not sure of the best TypeScript-y way to give the above imports

import * as server from 'socket.io';
const io = server(http);

import * as db from './db.driver';
import { Outcome } from './outcome';

var threshold = 1.1;    // minimum text score to be suggested

db.connect()
  .then(() => {

    io.on('connection', function(socket) {
        // what to do when client sends learning outcome text
        socket.on('outcome', function(text) {
            let cursor = db.matchOutcomes(text);
            
            let suggestions: Outcome[] = [];

            cursor.forEach((doc) => {
                if(doc.score < threshold) return false;
                // TODO: ^- this ensures weak results aren't communicated, but
                //  I'd really like it to just terminate the iteration.
                //  I think we need to use the cursor's "hasNext" and "next" operations,
                //      but the documentation is sloppy and I'm not sure how to.
                suggestions.push({
                    author: doc.author,
                    name: doc.name_,
                    text: doc.text
                });
            }, (err) => {
                if(err) throw err;
                socket.emit('suggestion', suggestions);
            });
        });
    });
  })
  .catch((err) => {
    console.log(err);
    db.disconnect();
  })


import * as clientModule from 'socket.io-client';
// TODO: not sure if this http.listen is really how we want this service to work
http.listen(3000, ()=> {
    // TODO: replace this whole callback with an actual client program ;)
    // testing space
    let client = clientModule("http://localhost:3000");   // for testing purposes only
    function testit(outcome: string) {
        console.log("Client: sending "+outcome);
        client.emit('outcome', outcome);
    }
    testit("cryptography management");

    client.on('suggestion', (suggestions: any) => {
        console.log(suggestions);
    });
    // So, the text search feature of mongo is certainly convenient,
    // but I'm not sure yet how it actually works. Just searching "complete"
    // yields nothing, yet the word certainly affects things in "complete test".
    // I admit there's a part of me that wants to learn about it just so I can write my own...
});