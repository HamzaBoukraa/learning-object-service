"use strict";
exports.__esModule = true;
var drivers_1 = require("./drivers/drivers");
var dotenv = require("dotenv");
var LibraryDriver_1 = require("./drivers/LibraryDriver");
dotenv.config();
// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------
var dburi;
switch (process.env.NODE_ENV) {
    case 'development':
        dburi = process.env.CLARK_DB_URI_DEV.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD)
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
        break;
    case 'production':
        dburi = process.env.CLARK_DB_URI.replace(/<DB_PASSWORD>/g, process.env.CLARK_DB_PWD)
            .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
            .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
        break;
    case 'test':
        dburi = process.env.CLARK_DB_URI_TEST;
        break;
    default:
        break;
}
var dataStore = new drivers_1.MongoDriver(dburi);
var fileManager = new drivers_1.S3Driver();
var library = new LibraryDriver_1.LibraryDriver();
// ----------------------------------------------------------------------------------
drivers_1.ExpressDriver.start(dataStore, fileManager, library);
