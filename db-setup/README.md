# Database Setup Script

Use this script to setup a local sandbox database. This script accomplishes three things:
1) Initialize a mongodb database with collections and indexes, as per the CLARK schema
2) Fill the database with standard outcomes drawn from official sources
3) Fill the database with user-created data from the live Atlas database.

This script may also be used to reset the live Atlas database, if the schema or standard outcomes have been changed. Careful, though - there are no guarantees that the existing data will still be valid when it is reinserted!

## Usage
- Setup a new, local database _without_ user-created data: `npm run db-setup`
- Setup a new, local database _with_ user-created data: `PASS=<atlas-pwd> npm run db-setup`
- Setup a new, remote database _without_ user-created data: `HOST=<ip>:<port> npm run db-setup`
- Setup a new, remote database _with_ user-created data: `HOST=<ip>:<port> PASS=<atlas-pwd> npm run db-setup`
- Reset the live Atlas database: `HOST=atlas PASS=<atlas-pwd> npm run db-setup`

## Behavior
Standard outcomes are never copied from the live Atlas database; they are recreated anew, meaning their internal database id's have changed. The setup script alters all outcome mappings to reflect the same standard outcome's correct internal id.

However, if the standard outcome in the live Atlas database is not identical to the new one (say we have since fixed a typo), the outcome's mapping is outright removed. Thus, running the script on the live Atlas database may alter user-created data without their consent, so be careful!

If the schema has changed (say objects get an additional unique property), existing user-created data is unlikely to be valid and this script does not guarantee any correct results. In this situation you may need to write your own script to edit each document before reinserting.

## Security
In order to fill the database with user-created data from the live Atlas database, Atlas must let your IP through its firewall. Log in to our Atlas account, click "connect", and "add my IP...". Be sure to remove it afterwards.

## Starting a Local Database
This script requires a running mongod process. To start one on your local machine:

#### With mongo installation ###
``` npm run localdb ```
#### With docker installation ###
``` docker run -p 27017:27017 mongo ```