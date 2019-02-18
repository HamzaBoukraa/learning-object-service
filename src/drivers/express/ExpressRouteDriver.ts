import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../../interfaces/interfaces';
import { Router } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { LearningObject } from '@cyber4all/clark-entity';
import { LearningObjectQuery } from '../../interfaces/DataStore';
import * as LearningObjectStatsRouteHandler from '../../LearningObjectStats/LearningObjectStatsRouteHandler';
import { UserToken } from '../../types';
import { initializeSingleFileDownloadRouter } from '../../SingleFileDownload/RouteHandler';
import * as LearningObjectRouteHandler from '../../LearningObjects/LearningObjectRouteHandler';
import { initializeCollectionRouter } from '../../Collections/RouteHandler';
import { ResourceError, mapErrorToStatusCode } from '../../errors';

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
        const page = req.query.currPage;
        const limit = req.query.limit;
        delete req.query.page;
        delete req.query.limit;
        if (Object.keys(req.query).length) {
          objectResponse = await LearningObjectInteractor.searchObjects({
            dataStore: this.dataStore,
            library: this.library,
            query: {
              ...req.query,
              page,
              limit,
            },
            userToken,
          });
        } else {
          objectResponse = await LearningObjectInteractor.fetchAllObjects({
            dataStore: this.dataStore,
            library: this.library,
            page,
            limit,
            userToken,
          });
        }
        objectResponse.objects = objectResponse.objects.map(obj =>
          obj.toPlainObject(),
        );
        res.status(200).send(objectResponse);
      } catch (e) {
        console.log(e);
        res.status(500).send(e);
      }
    });

    router.get('/learning-objects/:id/parents', async (req, res) => {
      try {
        const query: LearningObjectQuery = req.query;
        query.id = req.params.id;
        const parents = await LearningObjectInteractor.fetchParents({
          query,
          dataStore: this.dataStore,
        });
        res.status(200).send(parents.map(obj => obj.toPlainObject()));
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });

    router
      .route('/learning-objects/:username/:learningObjectName')
      .get(async (req, res) => {
        try {
          const username = req.params.username;
          const learningObjectName = req.params.learningObjectName;
          const userToken = req.user;
          const object = await LearningObjectInteractor.loadLearningObject({
            dataStore: this.dataStore,
            library: this.library,
            username,
            learningObjectName,
            userToken,
          });
          res.status(200).send(object.toPlainObject());
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      });

    initializeCollectionRouter({ router, dataStore: this.dataStore });

    router.get('/users/:username/learning-objects', async (req, res) => {
      try {
        const query = req.query;
        const userToken: UserToken = req.user;
        const loadChildren: boolean = query.children;
        delete query.children;
        const objects = await LearningObjectInteractor.loadUsersObjectSummaries(
          {
            query,
            userToken,
            loadChildren,
            dataStore: this.dataStore,
            library: this.library,
            username: req.params.username,
          },
        );
        res.status(200).send(objects.map(obj => obj.toPlainObject()));
      } catch (e) {
        if (e instanceof ResourceError) {
          const { code, message } = mapErrorToStatusCode(e);
          res.status(code).json({ message });
        }
        if (e instanceof Error && e.message === 'User not found') {
          res.status(404).send(`No user with username ${req.params.username}.`);
        } else {
          res.status(500).send('Internal Server Error');
        }
      }
    });

    router.get('/users/:username/learning-objects/profile', async (req, res) => {
      try {
        const objects = await LearningObjectInteractor.loadProfile({
          dataStore: this.dataStore,
          username: req.params.username,
          userToken: req.user,
        });

        res.status(200).send(objects.map(x => x.toPlainObject()));
      } catch (e) {
        res.status(500).send(e);
      }
    });

    LearningObjectStatsRouteHandler.initialize({
      router,
      dataStore: this.dataStore,
    });

    LearningObjectRouteHandler.initializePublic({
      router,
      dataStore: this.dataStore,
    });

    initializeSingleFileDownloadRouter({
      router,
      dataStore: this.dataStore,
      fileManager: this.fileManager,
    });
  }
}
