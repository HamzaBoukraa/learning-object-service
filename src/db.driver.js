// module providing consistent interaction with database across all our services
// code closely adapted from agm1984 @ https://stackoverflow.com/questions/24621940/how-to-properly-reuse-connection-to-mongodb-across-nodejs-application-and-module

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://localhost:27017/onion";

let _db;    // only created once, no matter how many times the module is required (or so I'm told)

// each service should call this and do everything within the callback
//  TODO: test what happens when more than one service calls this
module.exports.connect = async (callback) => {
    try {
        MongoClient.connect(uri, (err, db) => {
            _db = db;
            return callback(err);
        })
    } catch (e) { throw e; }    // TODO: more sophisticated error handling
}

// all following functions should only ever be called from the safety of the connection callback

// module.exports.getDB = () => _db;    // expose database for direct driver calls
// all changes to database should go through the following functions

module.exports.insert = async function(collection, document) {
    // TODO: any additional processing when we want to insert an element
    return await _db.collection(collection).insertOne(document);
    // TODO: we might wish to catch database errors here to handle them consistently
}

module.exports.find = function(collection, query, projection) {
    if(projection === undefined) projection = {};

    return _db.collection(collection).find(query, projection);
}

module.exports.disconnect = () => _db.close();