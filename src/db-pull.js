// this script will pull data from BloominOnion app and insert it into our MongoDB

// (but right now it's just proving that the db.service works)


var db = require('./db.service');

db.insert('standardLO', {
    outcome: "this is a test",
    criterion: 12
});