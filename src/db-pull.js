// this script will pull data from BloominOnion app and insert it into our MongoDB

var db = require('./db.driver');

// TODO: replace the following parameters with values from a config file
var heroku = require('mysql').createConnection({
    host: "tbd",
    user: "tbd",
    password: "tbd",
    database: "tbd"
});

db.connect((err) => {
    if(err) throw err;

    heroku.connect();

    var query = connection.query('SELECT * FROM tbd');  // TODO: I need the table names
    query
        .on('error', (err) => {
            console.log("Problem with heroku query: "+err);
        })
        .on('fields', (fields) => {
            // TODO: I doubt I need to do anything on this event; if so get rid of it
        })
        .on('result', (row) => {
            // TODO: parse data string into object
            // TODO: grab each LO, LG, etc. and adorn as necessary
            // TODO: insert into database
        })
        .on('end', () => {
            db.disconnect();
        });
    // TODO: repeat process for user table
    
    heroku.end();   // automatically queued, will not end connection until query is buffered
})