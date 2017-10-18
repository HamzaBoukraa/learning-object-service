# Learning Outcome Suggestion

This is a microservice project associated with Towson's CLARK platform for developing a cybersecurity curriculum repository.

## How to install

1) Run "git clone https://github.com/ksherb1/learning-outcome-suggestion.git" to clone the Github repository to your local machine.
2) Run "npm install" to install all node directories.
3) Run "mkdir db" to set up a directory for the database to use.
4) Run "mongod -f mongod.conf" to start the database.
5) Run "npm run build" to transpile all TypeScript files in 'src' to JavaScript files in 'dist'.
5) Run "node js/script/db-init.script.js" to initialize the database collections.
6) Run "node js/script/db-NCWF.script.js" to fill the database with NCWF Outcomes.
7) Run "node js/script/db-fill.script.js" to fill the database with legacy mysql learning objects, under a single 'legacy' user.
8) Run "mongod -f mongod.conf --shutdown" to shut down the database

## How to use

NOTE: You may need to adjust the "database.uri" value in the config file. If you're using the below instructions, it should be set to "mongodb://localhost:27017/onion". If you're using a docker image, it'll be something else.

To start the Learning Outcome Suggestion service:
1) Run "mongod -f mongod.conf" to start the database.
2) Run "node js/script/lo-suggestion.service.js" to start listening for queries and relaying related outcomes.
3) When terminating the process, also run "mongod -f mongod.conf --shutdown" to shut down the database.

When developing:
1) Run "npm start" when you start working. This ensures the database process is running, and watches for changes in any src/*.ts file to retranspile it.
2) Run "npm stop" when you are finished working, to shutdown the database.
3) If you elected to run "npm start" in the background, be sure to terminate the tsc process also!
