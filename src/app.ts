import {
  ExpressDriver,
  MongoDriver,
  S3Driver,
} from './drivers/drivers';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from './interfaces/interfaces';
import * as dotenv from 'dotenv';
import { LibraryDriver } from './drivers/LibraryDriver';
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

const dataStore: DataStore = new MongoDriver(dburi);
const fileManager: FileManager = new S3Driver();
const library: LibraryCommunicator = new LibraryDriver();
// ----------------------------------------------------------------------------------
ExpressDriver.start(dataStore, fileManager, library);
