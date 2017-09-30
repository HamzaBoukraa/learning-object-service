/**
 * This file is both a module and a service, handling all actual database interfacing
 * In order for this to work,
 *  we must START the database: "mongod -f mongod.conf"
 *  start listening for calls:  "node src/db.service.js"
 *      this will occupy your terminal. You can append a '&' to run in background,
 *      but then you'll need to kill it manually when you're done
 *  when you are all done, use: "mongod -f mongod.conf --shutdown"
 * 
 * With this module/service strategy, all actual database interfacing happens in one spot
 * - we only need to connect to the database once
 * - if inserting or deleting a particular type of item involves extra work,
 *      it happens here
 * - the functions exported by this module perform the actual communication,
 *      so client services need only call those functions as if this were a library
 * TODO: ideally the express app here ONLY listens to updates requested by this module's functions
 *       How do we secure the db against someone sending a malicious post to the app's port?
 */
var dbUri = "mongodb://localhost:27017/onion";  // this will change once Docker image is set up, I think
var servicePort = 3001; // this port must not be used by any of our other services, although I think Docker will handle that too
var request = require('request');


module.exports.insert = function(col, doc)  {
    // TODO: modifications to insertion process go here
    request({
        uri: "http://localhost:"+servicePort+"/insert",
        method: "POST",
        json: {
            collection: col,
            document: doc
        }
    }, function(err, res, body) {
        if(err) throw err;  // communication problem, presumably fatal
        if(body.error) { // database problem, handle as appropriate
            throw body.error;   // TODO: this isn't going to be appropriate in production
        }
    });
}

// module.exports.insert = function(obj) {
    // TODO: my thinking here is that we'll be calling insert with actual type-script objects
    //  and this function knows which collection each type goes in, as well as how it's stored
    //  that is assuming that every document insertable into a collection gets its own unique type
// }



if(require.main === module) {   // only do what follows if this module was run directly (ie. not when it is 'require'd)
    var app = require('express')();
    var bodyParser = require('body-parser');
    var MongoClient = require('mongodb').MongoClient;

    var db; // store db object from connection to avoid nesting inside callbacks

    MongoClient.connect(dbUri, function(err, database) {
        if(err) throw err;

        db = database;

        app.listen(servicePort);    // listen for http requests only after connection is established
        console.log("Database service listening on port "+servicePort);
    });

    app.use(bodyParser.json()); // treat all requests as containing json data

    // define insert behaviour
    app.post('/insert', function(request, response) {
        var collection = request.body.collection;
        var document = request.body.document;
        db.collection(collection).insertOne(document, function(err, res) {
            if(err) console.log(err);
            // TODO: I dunno if we need to make logging fancier (in a log file),
            //          or if mongodb handles all of that itself.
            response.json({
                error: err,
                dbres: res
            });
        })
    });

    // TODO: define all other behaviour
}