REPLICA=ClarkDB-shard-0
LIVE=clarkdb-shard-00-00-rktle.mongodb.net:27017,clarkdb-shard-00-01-rktle.mongodb.net:27017,clarkdb-shard-00-02-rktle.mongodb.net:27017
USER=secinj
# PASS must be given by user
DB=onion

# juggle $HOST variable for intuitive use later on
if [ "$HOST" = "atlas" ]    # if HOST is set to 'atlas', flag script to reset live db
then
    unset HOST
    echo "*** Resetting live db ***"
else
    if [ ! "$HOST" ]       # if HOST isn't set, set it to the default localhost
    then
        HOST=localhost:27017
    fi
    echo "*** Setting up db on $HOST ***"
fi

if [ ! "$PASS" ]
then
    # all we're doing is running setup without merging
    if [ "$HOST" ]
    then # setting up database on private machine
        echo "*** Running setup script (no backup) ***"
        SKIP_MERGE=1 CLARK_DB_URI="mongodb://$HOST/$DB" node dist/db-setup/db-setup.script.js
    else
        echo "Please prefix script with 'PASS=<atlas-pwd> '"
    fi
else
    echo "*** Backing up live db ***"
    mongodump --host "$REPLICA/$LIVE" --ssl --username $USER --password $PASS --authenticationDatabase admin --db $DB --out tmp/dump && \
    mv tmp/dump/$DB tmp/dump/tmp
    ls tmp

    echo "*** Restoring live db to tmp database ***"
    if [ "$HOST" ]
    then # setting up database on private machine
        mongo --host $HOST tmp --eval "db.dropDatabase()"
        mongorestore --host $HOST tmp/dump
    else                # otherwise, restarting live database
        mongo "mongodb://$LIVE/tmp?replicaSet=$REPLICA" --ssl --username  $USER --password $PASS --authenticationDatabase admin --eval "db.dropDatabase()"
        mongorestore --host "$REPLICA/$LIVE" --ssl --username $USER --password $PASS --authenticationDatabase admin --dir tmp/dump
    fi

    echo "*** Running setup script ***"
    if [ "$HOST" ]
    then # setting up database on private machine
        CLARK_DB_URI="mongodb://$HOST/$DB" node dist/db-setup/db-setup.script.js
    else
        CLARK_DB_URI="mongodb://$USER:$PASS@$LIVE/$DB?ssl=true&replicaSet=$REPLICA&authSource=admin" node dist/db-setup/db-setup.script.js
    fi

    echo "*** Cleaning up temporary data ***"
    if [ "$HOST" ]
    then # setting up database on private machine
        mongo --host $HOST tmp --eval "db.dropDatabase()"
    else
        mongo "mongodb://$LIVE/tmp?replicaSet=$REPLICA" --ssl --username  $USER --password $PASS --authenticationDatabase admin --eval "db.dropDatabase()"
    fi
    rm -r tmp
fi