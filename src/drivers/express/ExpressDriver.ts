import * as express from 'express';
import * as bodyParser from 'body-parser';
import {
  DataStore,
  LibraryCommunicator,
} from '../../shared/interfaces/interfaces';
import {
  ExpressRouteDriver,
  ExpressAdminRouteDriver,
  ExpressAuthRouteDriver,
} from '../drivers';
import * as logger from 'morgan';
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import {
  enforceAuthenticatedAccess,
  processToken,
  handleProcessTokenError,
} from '../../middleware';
import {
  sentryRequestHandler,
  sentryErrorHandler,
} from '../../shared/SentryConnector';
import { LearningObjectSearch } from '../../LearningObjectSearch';
import { FileMetadataModule } from '../../FileMetadata/FileMetadataModule';
import { FileManagerModule } from '../../FileManager/FileManagerModule';
import { FileAccessIdentities } from '../../FileAccessIdentities';
//@ts-ignore
import * as swaggerJsdoc from 'swagger-jsdoc';
//@ts-ignore
import * as swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';

const version = require('../../../package.json').version;

export class ExpressDriver {
  static app = express();

  static dataStore: DataStore;

  static library: LibraryCommunicator;

  static build(
    dataStore: DataStore,
    library: LibraryCommunicator,
  ) {
    this.dataStore = dataStore;
    this.library = library;

    this.attachConfigHandlers();

    this.setUpSwagger();

    /**
     * Public Access Routers
     */
    this.attachPublicRouters();

    /**
     * Authenticated Access Routers
     */
    this.attachAuthenticatedRouters();

    return this.app;
  }

  /**
   * Attaches app configuration handlers to Express app
   *
   */
  private static attachConfigHandlers() {
    // These sentry handlers must come first
    this.app.use(sentryRequestHandler);
    this.app.use(sentryErrorHandler);
    const logType = process.env.NODE_ENV === 'production' ? 'common' : 'dev';
    this.app.use(logger(logType));
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
      }),
    );
    this.app.use(bodyParser.json());
    this.app.use(cors({ origin: true, credentials: true }));
    this.app.set('trust proxy', true);
    this.app.use(cookieParser());

    // Attempt to parse token on all requests
    this.app.use(processToken, handleProcessTokenError);
  }

  /**
   * Attaches public route handlers to Express app
   *
   */
  private static attachPublicRouters() {
    this.app.use(LearningObjectSearch.expressRouter);
    this.app.use(FileMetadataModule.expressRouter);
    this.app.use(FileManagerModule.expressRouter);
    this.app.use(
      ExpressRouteDriver.buildRouter(
        this.dataStore,
        this.library,
      ),
    );
    this.app.use(FileAccessIdentities.expressRouter);
  }

  /**
   * Attaches route handlers that require authentication to Express app
   *
   */
  private static attachAuthenticatedRouters() {
    this.app.use(enforceAuthenticatedAccess);
    this.app.use(
      ExpressAuthRouteDriver.buildRouter(
        this.dataStore,
        this.library,
      ),
    );
    // TODO: Deprecate admin router and middleware in favor of default router with proper authorization logic in interactors
    this.app.use('/admin', ExpressAdminRouteDriver.buildRouter());
  }

  private static setUpSwagger() {
    // Swagger set up
    const options = {
      swaggerDefinition: {
        openapi: '3.0.0',
        info: {
          title: 'Learning Object Service',
          version: version,
          description:
            `Welcome to the Learning Objects' API`,
          license: {
            name: 'ISC',
            url: 'https://www.isc.org/licenses/'
          },
          contact: {
            name: 'CLARK',
            url: 'https://about.clark.center',
            email: 'skaza@towson.edu'
          }
        },
        servers: [
          {
            url: 'http://localhost:5000',
            description: 'Development Server'
          },
          {
            url: 'https://api-learning-objects.clark.center',
            description: 'Learning Object API'
          },
          {
            url: 'https://api-gateway.clark.center',
            description: 'Gateway API'
          }
        ]
      },
      apis: [
        './src/drivers/express/ExpressRouteDriver.ts'
      ]
    };
    const specs = swaggerJsdoc(options);

    // Write swagger specs to it's own file
    fs.writeFile('swagger.json', JSON.stringify(specs), (err) => {
      if (err) {
        console.error(err);
      }
    });

    this.app.use('/docs', swaggerUi.serve);
    this.app.get('/docs', swaggerUi.setup(specs, { explorer: true }));
  }
}
