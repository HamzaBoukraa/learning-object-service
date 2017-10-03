# Learning Outcome Suggestion

This is a microservice project associated with Towson's CLARK platform for developing a cybersecurity curriculum repository.

## How to install

In addition to cloning the repository with git and running "npm install" to install all node dependencies, you will need to do a couple extra steps to set up a local database.

Assuming your present working directory is the root folder of your cloned project:
1) make a directory db with "mkdir db" (or however you'd prefer to do it)
2) start the mongodb process with "mongod -f mongod.conf" <- you'll need to do this everytime you start working with this project!
3) run the database schema initialization file: "node src/db-init.js"
4) stop the mongodb process with "mongod -f mongod.conf --shutdown" <- you'll want to do this everytime you stop working with the project!

## How to use

There are several independent runnable scripts in this project at present. A brief description of each is below. Run them by "node [filename]". But first you will need to ensure the database is running. Start and stop it with steps 2 and 4 of the installation instructions above.
- db-init.js - initializes your local databases collections. Also deletes any existing data, so only run this once, or if you want a fresh start!
-db-NCWF.js - pulls Standard LO data from a file and pushes it to the database
    NOTE: this WILL duplicate records
- db-pull.js - pulls data from our existing MySQL database and puts it into your local MongoDB database. (actually right now it's just a quick test that db.driver.js works...)
    NOTE: this WILL duplicate records
- lo-suggestion.js - runs a service which listens for queries on a socket and sends back related standard learning outcomes. You can also run this by "npm start"

There is also one PERL script, for preparing accreditation data. You probably don't need to use it, but it has its own instructions in a comment at the top of the file.