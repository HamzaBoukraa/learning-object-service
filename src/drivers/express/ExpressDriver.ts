import * as express from 'express';
import * as bodyParser from 'body-parser';
import { DataStore, FileManager } from '../../interfaces/interfaces';
import {
  ExpressRouteDriver,
  ExpressAdminRouteDriver,
  ExpressAuthRouteDriver,
} from '../drivers';
import * as http from 'http';
import * as logger from 'morgan';
import { enforceTokenAccess } from '../../middleware/jwt.config';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import { enforceAdminAccess } from '../../middleware/admin-access';

export class ExpressDriver {
  static app = express();
  static start(dataStore: DataStore, fileManager: FileManager) {
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

    // Set our public api routes
    this.app.use('/', ExpressRouteDriver.buildRouter(dataStore));

    // Set Validation Middleware
    // this.app.use(enforceTokenAccess);
    // this.app.use((error: any, req: any, res: any, next: any) => {
    //   if (error.name === 'UnauthorizedError') {
    //     res.status(401).send('Invalid Access Token');
    //   }
    // });

    // Set our authenticated api routes
    this.app.use(
      '/',
      ExpressAuthRouteDriver.buildRouter(dataStore, fileManager),
    );

    // Set admin api routes
    this.app.use(enforceAdminAccess);
    this.app.use(
      '/admin',
      ExpressAdminRouteDriver.buildRouter(dataStore, fileManager),
    );

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
      console.log(`Learning Object Service running on localhost:${port}`),
    );

    return this.app;
  }
}
