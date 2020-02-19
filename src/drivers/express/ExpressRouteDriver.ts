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

    /**
     * @swagger
     * tags:
     *  name: Public
     *  description: Public learning object API routes
     */

    /**
     * @swagger
     * path:
     *  /:
     *    get:
     *      summary: Get learning object API welcome
     *      tags: [Public]
     *      responses:
     *        "200":
     *          description: API Version number and welcome message
     *          content:
     *            application/json:
     *              schema:
     *                type: object
     *                properties:
     *                  version:
     *                    type: string
     *                    example: 3.25.1
     *                  message:
     *                    type: string
     *                    example: Welcome to the Learning Objects' API v3.25.1
     */
    router.get('/', async (req, res) => {
      res.json({
        version,
        message: `Welcome to the Learning Objects' API v${version}`,
      });
    });

    /**
     * NOTE: This is a legacy route that is only used for getting the
     * CUID of a learning object given the author username and learning
     * object name.  This is to help provide backwards compatability
     * to documents that used the legacy details page route structure,
     * '/details/:username/:learningObjectName'.
     * 
     * @swagger
     * path:
     *  /learning-objects/{username}/{learningObjectName}:
     *    get:
     *      summary: Get a learning object CUID by author username and learning object name
     *      tags: [Public]
     *      parameters:
     *        - in: path
     *          name: username
     *          schema:
     *            type: string
     *          required: true
     *          description: Username of learning object author
     *          example: kkuczynski
     *        - in: path
     *          name: learningObjectName
     *          schema:
     *            type: string
     *          required: true
     *          description: Name of learning object
     *          example: Principles of Cyber Law and Policy
     *      responses:
     *        "200":
     *          description: A learning object CUID
     *          content:
     *            application/json:
     *              schema:
     *                type: string
     *                example: 80b8c821-ff5e-4134-bc71-06aa85287f3c
     *        "400":
     *          description: Bad request, missing author username or learning object name
     *        "404":
     *          description: A learning object with a given name and author username was not found
     *        "5XX":
     *          description: Unexpected error
     */
    router.get('/learning-objects/:username/:learningObjectName', async (req, res) => {
      try {
        const cuid = await LearningObjectInteractor.getLearningObjectCUID({
          dataStore: this.dataStore,
          username: req.params.username,
          learningObjectName: req.params.learningObjectName
        });
        res.status(200).json(cuid);
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({ message });
      }
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
