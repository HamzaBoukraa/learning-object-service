# Database Interaction
Code for all CLARK scripts and services needing direct contact with the database. Each service has usage instructions in its own README file.

## Processes
Name | Description
---|---
`db-setup`|script to initialize database collections and fill with standard outcomes/legacy objects
`db-interactor`|service to provide an interaction layer for core CLARK database functions
`lo-suggestion`|service to suggest CLARK learning outcomes which relate to a text argument you provide

## Environment Variables Used
Name|Default|Description
---|---|---
`CLARK_DB_URI`|see style rules|uri to connect to the database
`CLARK_DB_INTERACTOR_PORT`|"27016"|port where `db-interactor` service listens
`CLARK_LO_SUGGESTION_PORT`|"27015"|port where `lo-suggestion` service listens
`CLARK_LO_SUGGESTION_THRESHOLD`|"1.25"|minimum score for outcome to be suggested (calculation is vague)

## Installation
1) Clone the Github repository to your local machine:
   `git clone https://github.com/Cyber4All/database-interaction.git`
2) Switch to workspace: `cd database-interaction`
2) Install the taxonomy package: https://github.com/Cyber4All/taxonomy.git
3) Install the entity package: https://github.com/Cyber4All/entity.git
4) Install all node dependencies: `npm install`
5) Transpile TypeScript source: `npm run build`
6) Set up local database (requires mongo installation): `mkdir db`

## Usage
- Actively transpile TypeScript source: `npm run build:watch`
- Start local database (requires mongo installation): `npm run localdb`
- Start docker database (requires docker installation): `docker run -p 27017:27017 mongo`
- Run a process using a local database: `npm run <process>`
- Run a process using a remote database: `CLARK_DB_URI=<uri> npm run <process>`
- Run a specific `test/<file>.tape.ts` test: `npm test <file>`
- Run all `test/<file>.tape.ts` tests: `npm test`

## Docker (requires docker installation)
- Build a docker image: `npm run build:docker <process>`
- Tag a docker image for publishing: `docker tag <process> <user>/<repo>:<process>`
- Publish a docker image: `docker push <user>/<repo>:<process>`
- Run a process through its docker image: `docker run -e CLARK_DB_URI=<uri> <user>/<repo>:<process>`

## Development Style Rules
- Parameters for any scripts or services should use environment variables.
- Assign default environment variables in the `.env` file.
- Start every script and service with `require('useme');`, and in `useme.ts`, run any code that ALWAYS needs to happen (ex. extending Set prototype arithmetic).
- Dockerfiles should initialize all required environment variables, even when using the same default as in-code.
- IP addresses should default in-code to `localhost`.
- IP addresses should default in Dockerfiles to the Docker subnet, `172.17.0.2`.