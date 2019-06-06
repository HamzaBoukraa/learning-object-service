import { ExpressDriver, MongoDriver, S3Driver } from './drivers/drivers';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from './shared/interfaces/interfaces';
import * as dotenv from 'dotenv';
import { LibraryDriver } from './drivers/LibraryDriver';
import { MongoConnector } from './shared/Mongo/MongoConnector';
import { LearningObjectAdapter } from './LearningObjects/LearningObjectAdapter';
import { Stubs } from './stubs';
dotenv.config();
// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------

let dburi;
switch (process.env.NODE_ENV) {
  case 'development':
    dburi = process.env.CLARK_DB_URI_DEV.replace(
      /<DB_PASSWORD>/g,
      process.env.CLARK_DB_PWD,
    )
      .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
      .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
    break;
  case 'production':
    dburi = process.env.CLARK_DB_URI.replace(
      /<DB_PASSWORD>/g,
      process.env.CLARK_DB_PWD,
    )
      .replace(/<DB_PORT>/g, process.env.CLARK_DB_PORT)
      .replace(/<DB_NAME>/g, process.env.CLARK_DB_NAME);
    break;
  case 'test':
    dburi = process.env.CLARK_DB_URI_TEST;
    break;
  default:
    break;
}
const fileManager: FileManager = new S3Driver();
const library: LibraryCommunicator = new LibraryDriver();

/**
 * This is written as a self-invoking function to enable the syntactic sugar
 * of async-await.
 * FIXME: Both the MongoConnector and the MongoDriver are called here. This
 * enables us to leave the legacy code (MongoDriver) running as-is while we
 * begin to work on building and refactoring modules in this service.
 * Eventually, the MongoDriver should be completely removed, along with the
 * call to its build function here.
 */
(async () => {
  await MongoConnector.open(dburi);
  const dataStore = await MongoDriver.build(dburi);
  LearningObjectAdapter.open(dataStore, fileManager);
  ExpressDriver.start(dataStore, fileManager, library);
})();

