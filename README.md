# Learning Outcome Suggestion

This is a microservice project associated with Towson's CLARK platform for developing a cybersecurity curriculum repository.

## How to install

1) Run "git clone https://github.com/Cyber4All/learning-outcome-suggestion.git" to clone the Github repository to your local machine.
2) Run "npm install" to install all node directories.
3) Run "npm run build" to transpile all TypeScript files in 'ts' to JavaScript files in 'js'.

To set up a local database (requires mongo installation):
4) Run "mkdir db" to set up a directory for the database to use.
5) Run "mongod -f mongod.conf" to start the database.
6) Run "node js/script/db-setup.script.js" to initialize the database collections.
7) Run "mongod -f mongod.conf --shutdown" to shut down the database

## How to develop

Using a local database (requires mongo installation):
1) Run "npm start" when you start working. This ensures the local database process is running, and watches for changes in any ts/*.ts file to retranspile it.
2) Run programs with "node js/[filename].js". Note that you are running the transpiled JavaScript, not the TypeScript source.
2) Run "npm stop" when you are finished working, to shutdown the database.

Using a remote database:
1) Run "npm run build:watch" to watch for changes in any ts/*.ts file to retranspile it.
2) Run programs with 'CLARK\_DB="[db address]" node js/[filename].js' to run the program with the environment variable CLARK\_DB set appropriately. Alternatively, you may set the environment variable permanently and omit the cumbersome expression.

## How to build Docker images

1) Run "npm run build" to ensure JavaScript files are up to date.
2) Run "docker build -t lo-suggestion ." to build the lo-suggestion service.
3) Run "docker build -t db-setup -f Dockerfile.setup ." to build the database initialization task.

## How to run Docker images

Using Docker database:
1) Run "docker run -d mongo" to start a fresh database. This will pull the image "mongo" from DockerHub if necessary.
2) Run "docker run db-setup" to initialize the database.
3) Run "docker run -d lo-suggestion" to start up the lo-suggestion service.

Using remote database:
1) Run 'docker run -d -e CLARK_DB="[db address]" lo-suggestion' to start up the lo-suggestion service.
