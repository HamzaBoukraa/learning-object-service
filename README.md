# Database Interaction Service

This service acts as the interaction layer between the database and all other CLARK services.

## Event API

Please see the jsdocs for `db.driver.ts` and `db.gluer.ts` for usage, parameters and response types.

TODO: Generate and link to documentation for `db.driver.ts` and `db.gluer.ts`.

- `loadUser` (gluer)
- `loadLearningObject` (gluer)
- `addUser` (gluer)
- `addLearningObject` (gluer)
- `addLearningOutcome` (gluer)
- `editUser` (gluer)
- `editLearningObject` (gluer)
- `editLearningOutcome` (gluer)
- `reorderObject` (driver)
- `reorderOutcome` (driver)
- `unmapOutcome` (driver)
- `mapOutcome` (driver)
- `deleteUser` (driver)
- `deleteLearningObject` (driver)
- `deleteLearningOutcome` (driver)
- `findUser` (driver)
- `findLearningObject` (driver)

Also please see `suggestOutcomes` in `db.gluer.ts` for the following events:

- `suggestOutcomes` (`text` mode)

  Arguments:
  - `string` text
  - `number` threshold

  Response: `entity.Outcome[]`

- `suggestOutcomesREGEX` (`regex` mode)

  Arguments:
  - `string` text
  
  Response: `entity.Outcome[]`

## Communicating with this service
This service communicates via the socket-io protocol. Any scripts or services wishing to use it must act as a socket.io-client.

If you're using Node, your JS import should look something like this:
```javascript
var client = require('socket.io-client')(process.env["CLARK_DB_INTERACTOR"]);
```
Importing for TypeScript and browser-bound JS will be different.

Clients "emit" events, which include arguments and an "ack" callback function.

```javascript
client.emit('event-name', arg1, arg2, ..., function(response) {
    // do things with response
});
```
See [https://socket.io/](https://socket.io/) and of course Google for more help.

## Development Guide

### Style Rules
- Parameters for any scripts or services should use environment variables.
- Scripts and services should start by checking if each required environment variable exists, and if not, giving it a default value.
- Dockerfiles should initialize all environment variables, even when using the same default as in-code.
- IP addresses should default in-code to `localhost`.
- IP addresses should default in Dockerfiles to the Docker subnet, `172.17.0.2`.

### Installing a local repository
1) Clone the Github repository to your local machine.
   ```
   git clone https://github.com/Cyber4All/database-interaction.git
   ```
2) Install all node dependencies.
   ```
   npm install
   ```
3) Transpile all TypeScript files in 'ts' to JavaScript files in 'js'.
   ```
   npm run build
   ```

#### To set up a local database (requires mongo installation):
4) Set up a directory for the database to use.
   ```
   mkdir db
   ```
5) Start the database.
   ```
   npm run localdb
   ```
6) Initialize the database collections.
   ```
   npm run setup
   ```

### How to develop

1) Actively transpile any changes from TypeScript to JavaScript.
   ```
   run npm build:watch
   ```
   NOTE: The transpiler won't always notice new ts files. You might need to redo this step periodically.

2) Running programs depends on what database you use. See your options below.

#### To use your local database (requires mongo installation):
1) Start the database.
   ```
   npm run localdb
   ```
2) Run programs simply by running the respective JavaScript.
   ```
   node js/<path/name>.js
   ```

#### To use Docker images (requires Docker installation):
1) Start the database. This pulls a standard mongo image from DockerHub.
   ```
   docker run -p 27017:27017 -d mongo
   ```
2) Initialize the database.
   ```
   docker run ksherb1/ksherb1:db-setup
   ```
   TODO: We should have an organization DockerHub account. Command will probably look like `docker run clark/db-setup` or `docker run cyber4all/clark:db-setup`, depending on the expense we spare.

3) Run programs simply by running the respective JavaScript.
   ```
   node js/<path/name>.js
   ```

#### To use a remote database (not recommended for testing):
1) Prefix running any program by setting the `CLARK\_DB` path variable, or alternatively set up an environment with the variable permanently set.
   ```
   CLARK_DB="<IP>:<port>" node js/<path/name>.js
   ```

## Publishing Guide

### How to publish Docker images

1) Ensure JavaScript files are up to date. Run `npm run build` to transpile all TS code, and consider first deleting the entire JS folder if you've been deleting or moving files.
2) Construct a Dockerfile, if it doesn't already exist. Ask Google for help.
3) Build the Docker image.
   ```
   docker build -t <image-name> -f <Dockerfile name> .
   ```
   If you're rebuilding the `db-interaction` image, there's no need for the `-f` option.
   
4) Tag the image for publication.
   ```
   docker tag <image-name> ksherb1/ksherb1:<image-name>
   ```
   TODO: Once we have an organization DockerHub account, this and the below step will look more like `docker tag <image-name> cyber4all/clark:<image-name>`, or ideally `docker tag <image-name> clark/<image-name>:<version>`.

5) Upload the image (if you're sure).
   ```
   docker push ksherb1/ksherb1:<image-name>
   ```
   You will be prompted for credentials. Obviously this will be more useful when there is an organization account.

### How to run Docker images

If you must manually start the database interaction service, here is the command:
```
docker run -d -e CLARK_DB="<IP>:<port>" ksherb1/ksherb1:db-interaction
```
