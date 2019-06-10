import * as http from 'http';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as logger from 'morgan';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import {
  enforceAuthenticatedAccess,
  processToken,
  handleProcessTokenError,
} from './middleware';
import {
  sentryRequestHandler,
  sentryErrorHandler,
  reportError,
} from './shared/SentryConnector';

import {
  MongoDriver,
  S3Driver,
  ExpressRouteDriver,
  ExpressAuthRouteDriver,
  ExpressAdminRouteDriver,
} from './drivers/drivers';
import {
  FileManager,
  LibraryCommunicator,
  DataStore,
} from './shared/interfaces/interfaces';
import 'dotenv/config';
import { LibraryDriver } from './drivers/LibraryDriver';
import { MongoConnector } from './shared/Mongo/MongoConnector';
import { LearningObjectAdapter } from './LearningObjects/LearningObjectAdapter';
import { LearningObjectSearch } from './LearningObjectSearch';

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
 * Initializing express server
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
    LearningObjectAdapter.open(dataStore, fileManager);
    initModules();
    initExpressServer();
  } catch (e) {
    reportError(e);
  }
}
/**
 * Initializes all Modules for the application
 *
 */
function initModules() {
  LearningObjectSearch.initialize();
}

/**
 * Initializes express server
 *
 */
function initExpressServer() {
  const app = express();
  attachConfigHandlers(app);

  /**
   * Public Access Routers
   */
  attachPublicRouters(app);

  /**
   * Authenticated Access Routers
   */
  attachAuthenticatedRouters(app);

  /**
   * Start HTTP Server
   */
  startHttpServer(app);
}

/**
 * Attaches app configuration handlers to Express app
 *
 * @param {Express} app [The express app to attach handlers to]
 */
function attachConfigHandlers(app: express.Express) {
  // These sentry handlers must come first
  app.use(sentryRequestHandler);
  app.use(sentryErrorHandler);
  app.use(logger('dev'));
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );
  app.use(bodyParser.json());
  app.use(cors({ origin: true, credentials: true }));
  app.set('trust proxy', true);
  app.use(cookieParser());

  // Attempt to parse token on all requests
  app.use(processToken, handleProcessTokenError);
}

/**
 * Attaches public route handlers to Express app
 *
 * @param {Express} app [The express app to attach handlers to]
 */
function attachPublicRouters(app: express.Express) {
  app.use(ExpressRouteDriver.buildRouter(dataStore, library, fileManager));
}

/**
 * Attaches route handlers that require authentication to Express app
 *
 * @param {Express} app [The express app to attach handlers to]
 */
function attachAuthenticatedRouters(app: express.Express) {
  app.use(enforceAuthenticatedAccess);
  app.use(ExpressAuthRouteDriver.buildRouter(dataStore, fileManager, library));
  // TODO: Deprecate admin router and middleware in favor of default router with proper authorization logic in interactors
  app.use('/admin', ExpressAdminRouteDriver.buildRouter());
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
