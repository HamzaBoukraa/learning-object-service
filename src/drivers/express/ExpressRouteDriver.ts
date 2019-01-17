import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../../interfaces/interfaces';
import { Router } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { LearningObject } from '@cyber4all/clark-entity';
import * as TokenManager from '../TokenManager';
import { LearningObjectQuery } from '../../interfaces/DataStore';
import * as LearningObjectStatsRouteHandler from '../../LearningObjectStats/LearningObjectStatsRouteHandler';
import { UserToken } from '../../types';
import { initializeSingleFileDownloadRouter } from '../../SingleFileDownload/RouteHandler';
import * as LearningObjectRouteHandler from '../../LearningObjects/LearningObjectRouteHandler';
import { initializeCollectionRouter } from '../../Collections/RouteHandler';
import { LEARNING_OBJECT_ROUTES } from '../../routes';
import { Request, Response } from 'express';
import { fileNotFound } from '../../assets/filenotfound';

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
        const currPage = req.query.currPage ? +req.query.currPage : null;
        const limit = req.query.limit ? +req.query.limit : null;

        const status = req.query.status ? req.query.status : null;

        const name = req.query.name;
        const author = req.query.author;
        const collection = req.query.collection;
        let length = req.query.length;
        length = length && !Array.isArray(length) ? [length] : length;
        let level = req.query.level;
        level = level && !Array.isArray(level) ? [level] : level;
        let standardOutcomes = req.query.standardOutcomes;
        standardOutcomes =
          standardOutcomes && !Array.isArray(standardOutcomes)
            ? [standardOutcomes]
            : standardOutcomes;
        const released = req.query.released;

        // For broad searching | Search all fields to match inputed text
        const text = req.query.text;
        const orderBy = req.query.orderBy;
        const sortType = req.query.sortType ? +req.query.sortType : null;

        let objectResponse: {
          total: number;
          objects: Partial<LearningObject>[];
        };

        const accessUnpublished = false;

        if (
          name ||
          author ||
          collection ||
          length ||
          level ||
          standardOutcomes ||
          text ||
          orderBy ||
          sortType ||
          released
        ) {
          objectResponse = await LearningObjectInteractor.searchObjects(
            this.dataStore,
            this.library,
            {
              name,
              author,
              collection,
              status,
              length,
              level,
              standardOutcomeIDs: standardOutcomes,
              text,
              accessUnpublished,
              orderBy,
              sortType,
              currPage,
              limit,
              released,
            },
          );
        } else {
          objectResponse = await LearningObjectInteractor.fetchAllObjects(
            this.dataStore,
            this.library,
            currPage,
            limit,
          );
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
          let accessUnpublished = false;
          const username = req.params.username;
          const cookie = req.cookies.presence;
          if (cookie) {
            const user = await TokenManager.decode(cookie);
            accessUnpublished = user.username === username;
          }
          const object = await LearningObjectInteractor.loadLearningObject(
            this.dataStore,
            this.library,
            username,
            req.params.learningObjectName,
            accessUnpublished,
          );
          res.status(200).send(object.toPlainObject());
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      });

    initializeCollectionRouter({ router, dataStore: this.dataStore });

    router.get('/users/:username/learning-objects', async (req, res) => {
      try {
        const userToken: UserToken = req.user;
        const loadChildren: boolean = req.query.children;
        const objects = await LearningObjectInteractor.loadLearningObjectSummary(
          {
            userToken,
            loadChildren,
            dataStore: this.dataStore,
            library: this.library,
            username: req.params.username,
          },
        );
        res.status(200).send(objects.map(obj => obj.toPlainObject()));
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
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

    LearningObjectStatsRouteHandler.initialize({
      router,
      dataStore: this.dataStore,
    });
  }
}

function fileNotFoundResponse(object: any, req: Request, res: Response) {
  const redirectUrl = LEARNING_OBJECT_ROUTES.CLARK_DETAILS({
    objectName: object.name,
    username: req.params.username,
  });
  res
    .status(404)
    .type('text/html')
    .send(fileNotFound(redirectUrl));
}
