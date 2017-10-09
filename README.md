# Learning Outcome Suggestion

This is a microservice project associated with Towson's CLARK platform for developing a cybersecurity curriculum repository.

## How to install

In addition to cloning the repository with git and running "npm install" to install all node dependencies, you will need to do a couple extra steps to set up a local database.

Assuming your present working directory is the root folder of your cloned project:
1) make a directory db with "mkdir db" (or however you'd prefer to do it)
2) start the mongodb process with "mongod -f mongod.conf"
3) run the database schema initialization file: "node src/db-init.js"
4) stop the mongodb process with "mongod -f mongod.conf --shutdown"

## How to use

To start both the database and automatic TypeScript compiling from the 'ts' directory, run "npm start". When you are finished working, run "npm stop" to shut down the database.

There are several independent runnable scripts in this project at present. A brief description of each is below. Run them by "node [filename]". Note that most of these require the database to be running.
- db-init.js - initializes your local databases collections. Also deletes any existing data, so only run this once, or if you want a fresh start!
-db-NCWF.js - pulls Standard LO data from a file and pushes it to the database
    NOTE: this WILL duplicate records
- db-pull.js - pulls data from our existing MySQL database and puts it into your local MongoDB database.
    NOTE: NOT FINISHED - DO NOT RUN
- lo-suggestion.js - runs a service which listens for queries on a socket and sends back related standard learning outcomes. You can also run this by "npm start"
- There is also one PERL script, for preparing accreditation data. You probably don't need to use it, but it has its own instructions in a comment at the top of the file.