import 'dotenv/config';
import * as http from 'http';
import * as express from 'express';
import { reportError } from './shared/SentryConnector';

import { MongoDriver, S3Driver, ExpressDriver } from './drivers/drivers';
import {
  FileManager,
  LibraryCommunicator,
  DataStore,
} from './shared/interfaces/interfaces';
import { LibraryDriver } from './drivers/LibraryDriver';
import { MongoConnector } from './shared/Mongo/MongoConnector';
import { LearningObjectAdapter } from './LearningObjects/LearningObjectAdapter';
import { LearningObjectSearch } from './LearningObjectSearch';
import { HierarchyAdapter } from './LearningObjects/Hierarchy/HierarchyAdapter';
import { FileManagerAdapter } from './FileManager/adapters/FileManagerAdapter';
import { FileMetadata } from './FileMetadata';

// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------

const HTTP_SERVER_PORT = process.env.PORT || '3000';

let dburi: string;
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
let dataStore: DataStore;

/**
 * Starts the application by
 * Establishing DB connections
 * Initializing modules
 * Building express server
 * Starting Http Server
 *
 *  FIXME: Both the MongoConnector and the MongoDriver are called here. This
 * enables us to leave the legacy code (MongoDriver) running as-is while we
 * begin to work on building and refactoring modules in this service.
 * Eventually, the MongoDriver should be completely removed, along with the
 * call to its build function here.
 *
 */
async function startApp() {
  try {
    await MongoConnector.open(dburi);
    dataStore = await MongoDriver.build(dburi);
    initModules();
    const app = ExpressDriver.build(dataStore, fileManager, library);
    startHttpServer(app);
  } catch (e) {
    reportError(e);
  }
}
/**
 * Initializes all Modules for the application
 *
 */
function initModules() {
  HierarchyAdapter.open(dataStore);
  LearningObjectAdapter.open(dataStore, fileManager);
  LearningObjectSearch.initialize();
  FileManagerAdapter.open(fileManager);
  FileMetadata.initialize();
}

/**
 * Serves Express app via HTTP
 *
 * @param {Express} app [The express app to use as servers request listener]
 */
function startHttpServer(app: express.Express): void {
  const server = http.createServer(app);
  server.listen(HTTP_SERVER_PORT, () =>
    console.log(
      `Learning Object Service running on http://localhost:${HTTP_SERVER_PORT}`,
    ),
  );
}

startApp();
