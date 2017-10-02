// this script will pull data from BloominOnion app and insert it into our MongoDB

// (but right now it's just proving that the db.driver works)


var db = require('./db.driver');

db.connect((err) => {
    if(err) throw err;

    db.insert('standardLO', {
        outcome: "this is a complete test",
        criterion: "CAE KU 18"
    });

    db.disconnect();
})