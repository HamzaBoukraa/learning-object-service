import {
  DataStore,
  LibraryCommunicator,
} from '../../shared/interfaces/interfaces';
import { Router } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import * as LearningObjectStatsRouteHandler from '../../LearningObjectStats/LearningObjectStatsRouteHandler';
import * as LearningObjectRouteHandler from '../../LearningObjects/adapters/LearningObjectRouteHandler';
import { initializeCollectionRouter } from '../../Collections/RouteHandler';
import {
  mapErrorToResponseData,
} from '../../shared/errors';
import { LearningObject } from '../../shared/entity';
import { initializePublic as initializePublicHierarchyRoutes } from '../../LearningObjects/Hierarchy/HierarchyRouteHandler';
import * as LearningOutcomeRouteHandler from '../../LearningOutcomes/LearningOutcomeRouteHandler';

// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressRouteDriver {
  constructor(
    private dataStore: DataStore,
    private library: LibraryCommunicator,
  ) {}

  public static buildRouter(
    dataStore: DataStore,
    library: LibraryCommunicator,
  ): Router {
    const e = new ExpressRouteDriver(dataStore, library);
    const router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private setRoutes(router: Router): void {
    router.get('/', async (req, res) => {
      res.json({
        version,
        message: `Welcome to the Learning Objects' API v${version}`,
      });
    });

    router.route('/learning-objects').get(async (req, res) => {
      try {
        let objectResponse: {
          total: number;
          objects: Partial<LearningObject>[];
        };
        const userToken = req.user;
        const page = req.query.currPage || req.query.page;
        const limit = req.query.limit;
        const standardOutcomeIDs = req.query.standardOutcomes;
        const query = Object.assign({}, req.query, { page, limit, standardOutcomeIDs });

        objectResponse = await LearningObjectInteractor.searchObjects({
            dataStore: this.dataStore,
            query,
            userToken,
        });

        objectResponse.objects = objectResponse.objects.map(obj =>
          obj.toPlainObject(),
        );
        res.status(200).send(objectResponse);
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({ message });
      }
    });
    initializePublicHierarchyRoutes({ router, dataStore: this.dataStore });

    initializeCollectionRouter({ router, dataStore: this.dataStore });

    LearningOutcomeRouteHandler.initializePublic({ router, dataStore: this.dataStore });

    /**
     * @deprecated
     */
    router.get(
      '/users/:username/learning-objects/profile',
      async (req, res) => {
        res.redirect(301, req.originalUrl.replace('/profile', ''));
      },
    );

    LearningObjectStatsRouteHandler.initialize({
      router,
      dataStore: this.dataStore,
    });

    LearningObjectRouteHandler.initializePublic({
      router,
      dataStore: this.dataStore,
      library: this.library,
    });
  }
}
