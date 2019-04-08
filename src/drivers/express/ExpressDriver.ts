import * as express from 'express';
import * as bodyParser from 'body-parser';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../../interfaces/interfaces';
import {
  ExpressRouteDriver,
  ExpressAdminRouteDriver,
  ExpressAuthRouteDriver,
} from '../drivers';
import * as http from 'http';
import * as logger from 'morgan';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import {
  enforceAuthenticatedAccess,
  processToken,
  handleProcessTokenError,
} from '../../middleware';
import { sentryRequestHandler, sentryErrorHandler } from '../SentryConnector';

export class ExpressDriver {
  static app = express();

  static start(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
  ) {

   // These sentry handlers must come first
    this.app.use(sentryRequestHandler);
    this.app.use(sentryErrorHandler);
    // configure app to use bodyParser()
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
      }),
    );
    this.app.use(bodyParser.json());

    // Setup route logger
    this.app.use(logger('dev'));

    this.app.use(
      cors({
        origin: true,
        credentials: true,
      }),
    );
    // Set up cookie parser
    this.app.use(cookieParser());

    this.app.use(processToken, handleProcessTokenError);

    // Set our public api routes
    this.app.use(
      '/',
      ExpressRouteDriver.buildRouter(dataStore, library, fileManager),
    );

    // Set Validation Middleware
    this.app.use(enforceAuthenticatedAccess);

    // Set our authenticated api routes
    this.app.use(
      '/',
      ExpressAuthRouteDriver.buildRouter(dataStore, fileManager, library),
    );

    // Set admin api routes
    this.app.use('/admin', ExpressAdminRouteDriver.buildRouter());

    /**
     * Get port from environment and store in Express.
     */
    const port = process.env.PORT || '3000';
    this.app.set('port', port);

    // Allow Proxy
    this.app.set('trust proxy', true);

    /**
     * Create HTTP server.
     */
    const server = http.createServer(this.app);

    /**
     * Listen on provided port, on all network interfaces.
     */
    server.listen(port, () =>
      console.log(`Learning Object Service running at http://localhost:${port}`),
    );

    return this.app;
  }
}
