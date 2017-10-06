// Database instructions:
//  create storage directory "mkdir db" (it's in .gitignore, so it doesn't get cloned)
//  start local database with "mongod -f mongod.conf"
//              run this file "node src/db-init.js"
//
//      WARNING: running this script will remove all documents presently in your collections
//
//  when finished, stop with "mongod -f mongod.conf --shutdown"
const dbUri = "mongodb://localhost:27017/onion";  // this will change once Docker image is set up, I think

var MongoClient = require('mongodb').MongoClient;

const valid_SLO = {
    $and: [
        { outcome: {$type: "string"} },
        { criterion: {$type: "string"} }
    ]
};


MongoClient.connect(dbUri, async (err, db) => {
    if(err) throw err;

    // drop collections
    try {
        await db.dropCollection('standardLO');
        console.log("Deleted existing standardLO collection");
    } catch(err) { }    // an error here means there was no collection to drop

    // TODO: drop other collections in schema


    try {
        // initialize collections, with validation
        let SLO = await db.createCollection('standardLO', { validator: valid_SLO } );

        // TODO: initialize other collections in schema

        // create indexes as needed
        await sLO.createIndex( {outcome: "text" } );

        // TODO: create other indexes, as needed
    } catch(err) {
        console.log("Initialization failed: "+err);
    }

    db.close();
});
