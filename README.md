# Learning Outcome Suggestion

This is a microservice project associated with Towson's CLARK platform for developing a cybersecurity curriculum repository.

## How to install

1) Run "git clone https://github.com/ksherb1/learning-outcome-suggestion.git" to clone the Github repository to your local machine.
2) Run "npm install" to install all node directories.
3) Run "mkdir db" to set up a directory for the database to use.
4) Run "npm start" to both start the database and transpile all TypeScript files to JavaScript.
5) Run "node dist/db-init.script.js" to initialize the database collections.
6) Run "node dist/db-NCWF.script.js" to fill the database with NCWF Outcomes.
7) Run "node dist/db-pull.script.js" to fill the database with legacy mysql records. *NOT TESTED*
8) Run "npm stop" to shut down the database

## How to use

To start the Learning Outcome Suggestion service:
1) Run "mongod -f mongod.conf" to start the database.
2) Run "node dist/lo-suggestion.service.js" to start listening for queries and relaying related outcomes.
3) When terminating the process, also run "mongod -f mongod.conf --shutdown" to shut down the database.

When developing:
1) Run "npm start" when you start working. This ensures the database process is running, and watches for changes in any src/*.ts file to retranspile it.
2) Run "npm stop" when you are finished working. This ensures the database process is shut down.
3) If you elected to run "npm start" in the background, be sure to terminate the tsc process also!
