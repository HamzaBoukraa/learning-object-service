import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../../shared/interfaces/interfaces';
import { Router } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import * as LearningObjectStatsRouteHandler from '../../LearningObjectStats/LearningObjectStatsRouteHandler';
import { UserToken } from '../../shared/types';
import { initializeSingleFileDownloadRouter } from '../../SingleFileDownload/RouteHandler';
import * as LearningObjectRouteHandler from '../../LearningObjects/LearningObjectRouteHandler';
import { initializeCollectionRouter } from '../../Collections/RouteHandler';
import {
  ResourceError,
  mapErrorToResponseData,
  ServiceError,
} from '../../shared/errors';
import { LearningObject } from '../../shared/entity';
import { initializePublic as initializePublicHierarchyRoutes } from '../../LearningObjects/Hierarchy/HierarchyRouteHandler';

// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressRouteDriver {
  constructor(
    private dataStore: DataStore,
    private library: LibraryCommunicator,
    private fileManager: FileManager,
  ) {}

  public static buildRouter(
    dataStore: DataStore,
    library: LibraryCommunicator,
    fileManager: FileManager,
  ): Router {
    const e = new ExpressRouteDriver(dataStore, library, fileManager);
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
            library: this.library,
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

    router
      .route('/learning-objects/:username/:learningObjectName')
      .get(async (req, res) => {
        try {
          const username = req.params.username;
          const learningObjectName = req.params.learningObjectName;
          const userToken = req.user;
          const revision = req.query.revision;
          const object = await LearningObjectInteractor.loadLearningObject({
            dataStore: this.dataStore,
            library: this.library,
            username,
            learningObjectName,
            userToken,
            revision,
          });
          res.status(200).send(object.toPlainObject());
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({message});
        }
      });

    initializeCollectionRouter({ router, dataStore: this.dataStore });

    router.get('/users/:username/learning-objects', async (req, res) => {
      try {
        const query = req.query;
        const userToken: UserToken = req.user;
        const released: string = query.released;
        const loadChildren: boolean = query.children;
        delete query.children;
        const objects = await LearningObjectInteractor.searchUsersObjects(
          {
            query,
            userToken,
            dataStore: this.dataStore,
            library: this.library,
            username: req.params.username,
            released,
          },
        );
        res.status(200).send(objects);
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({ message });
      }
    });

    router.get(
      '/users/:username/learning-objects/profile',
      async (req, res) => {
        try {
          const objects = await LearningObjectInteractor.loadProfile({
            dataStore: this.dataStore,
            username: req.params.username,
            userToken: req.user,
          });

          res.status(200).send(objects.map(x => x.toPlainObject()));
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({message});
        }
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

    initializeSingleFileDownloadRouter({
      router,
      dataStore: this.dataStore,
      fileManager: this.fileManager,
    });
  }
}
