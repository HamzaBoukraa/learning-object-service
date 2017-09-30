// Database instructions:
//  create storage directory "mkdir db" (it's in .gitignore, so it doesn't get cloned)
//  start local database with "mongod -f mongod.conf"
//              run this file "node src/db-init.js"
//
//      WARNING: running this script will remove all documents presently in your collections
//
//  when finished, stop with "mongod -f mongod.conf --shutdown"
var dbUri = "mongodb://localhost:27017/onion";  // this will change once Docker image is set up, I think

var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(dbUri)
    .then(function(db) {
        db.dropCollection('standardLO')
    .then(function(res) {
        throw "Deleted existing standardLO collection to recreate it."
    })
    .catch(function(err) {
        if(err) console.log(err);

        db.createCollection('standardLO', { validator: {
            $and: [
                { outcome: {$type: "string"} },
                { criterion: {$type: "string"} }
            ]
        } })
    .then(function(col) {
        col.createIndex( {outcome: "text"} )

    // TODO: initialise the learning object collection (not clear yet on what it looks like)

    .then(function(res) {
        db.close();
    }); }); }); }); // close promises
    // TODO: these promises (except dropping the collections) haven't got any error handling
