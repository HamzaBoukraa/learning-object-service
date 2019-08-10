import 'dotenv/config';
import * as http from 'http';
import * as express from 'express';
import { reportError } from './shared/SentryConnector';

import { MongoDriver, ExpressDriver } from './drivers/drivers';
import {
  LibraryCommunicator,
  DataStore,
} from './shared/interfaces/interfaces';
import { LibraryDriver } from './drivers/LibraryDriver';
import { MongoConnector } from './shared/MongoDB/MongoConnector';
import { LearningObjectAdapter } from './LearningObjects/adapters/LearningObjectAdapter';
import { LearningObjectSearch } from './LearningObjectSearch';
import { HierarchyAdapter } from './LearningObjects/Hierarchy/HierarchyAdapter';
import { BundlerModule } from './LearningObjects/Publishing/Bundler/BundlerModule';
import { FileMetadataModule } from './FileMetadata/FileMetadataModule';
import { FileManagerModule } from './FileManager/FileManagerModule';
import { LearningObjectsModule } from './LearningObjects/LearningObjectsModule';
import { LearningObjectSubmissionAdapter } from './LearningObjectSubmission/adapters/LearningObjectSubmissionAdapter';
import { ElasticsearchSubmissionPublisher } from './LearningObjectSubmission/ElasticsearchSubmissionPublisher';

// ----------------------------------------------------------------------------------
// Initializations
// ----------------------------------------------------------------------------------

const HTTP_SERVER_PORT = process.env.PORT || '3000';
const KEEP_ALIVE_TIMEOUT = process.env.KEEP_ALIVE_TIMEOUT;

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
const library: LibraryCommunicator = new LibraryDriver();
let dataStore: DataStore;
const publisher = new ElasticsearchSubmissionPublisher();

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
    const app = ExpressDriver.build(dataStore, library);
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
  LearningObjectAdapter.open(dataStore, library);
  LearningObjectSubmissionAdapter.open(publisher);
  LearningObjectsModule.initialize();
  LearningObjectSearch.initialize();
  FileManagerModule.initialize();
  BundlerModule.initialize();
  FileMetadataModule.initialize();
}

/**
 * Serves Express app via HTTP
 *
 * @param {Express} app [The express app to use as servers request listener]
 */
function startHttpServer(app: express.Express): void {
  const server = http.createServer(app);
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT
    ? parseInt(KEEP_ALIVE_TIMEOUT, 10)
    : server.keepAliveTimeout;
  server.listen(HTTP_SERVER_PORT, () =>
    console.log(
      `Learning Object Service running on http://localhost:${HTTP_SERVER_PORT}`,
    ),
  );
}

startApp();
