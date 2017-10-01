// this script will pull data from BloominOnion app and insert it into our MongoDB

// (but right now it's just proving that the db.service works)


var db = require('./db.service');

db.connect((err) => {
    if(err) throw err;

    db.insert('standardLO', {
        outcome: "this is a test again",
        criterion: 15
    });

    db.disconnect();
})