import {
  DataStore,
  LibraryCommunicator,
  FileManager,
} from '../../interfaces/interfaces';
import { Router } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { LearningObject } from '@cyber4all/clark-entity';
import * as TokenManager from '../TokenManager';
import { LearningObjectQuery } from '../../interfaces/DataStore';
import * as LearningObjectStatsRouteHandler from '../../LearningObjectStats/LearningObjectStatsRouteHandler';
import { initializeSingleFileDownloadRouter } from '../../SingleFileDownload/RouteHandler';
import { initializePublicLearningObjectRouter } from '../../LearningObjects/LearningObjectRouteHandler'

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

        let learningObjects: { total: number; objects: LearningObject[] };

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
          learningObjects = await LearningObjectInteractor.searchObjects(
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
          learningObjects = await LearningObjectInteractor.fetchAllObjects(
            this.dataStore,
            this.library,
            currPage,
            limit,
          );
        }
        res.status(200).send(learningObjects);
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
        res.status(200).send(parents);
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
            accessUnpublished = user.username === username ? true : false;
          }
          const object = await LearningObjectInteractor.loadLearningObject(
            this.dataStore,
            this.library,
            username,
            req.params.learningObjectName,
            accessUnpublished,
          );
          res.status(200).send(object);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      });

    /**
     * Return all collections {name: string, abvName: string, primaryColor: string, hasLogo: boolean}
     */
    router.get('/collections', async (req, res) => {
      try {
        const collections = await LearningObjectInteractor.fetchCollections(
          this.dataStore,
        );
        res.status(200).send(collections);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });
    /**
     * Return a full collection {name: string, abstracts: [], learningObjects: []}
     */
    router.get('/collections/:name', async (req, res) => {
      try {
        const name = req.params.name;
        const collection = await LearningObjectInteractor.fetchCollection(
          this.dataStore,
          name,
        );
        res.status(200).send(collection);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });
    /**
     * Return a list of learningObjects from a collection
     */
    router.get('/collections/:name/learning-objects', async (req, res) => {
      try {
        const objects = await LearningObjectInteractor.fetchCollectionObjects(
          this.dataStore,
          req.params.name,
        );
        res.status(200).send(objects);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });
    /**
     * Return the name of a collection and a list of it's abstracts
     */
    router.get('/collections/:name/meta', async (req, res) => {
      try {
        const collectionMeta = await LearningObjectInteractor.fetchCollectionMeta(
          this.dataStore,
          req.params.name,
        );
        res.status(200).send(collectionMeta);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });
    router.get('/users/:username/learning-objects', async (req, res) => {
      try {
        const objects = await LearningObjectInteractor.loadLearningObjectSummary(
          {
            dataStore: this.dataStore,
            library: this.library,
            username: req.params.username,
            accessUnpublished: false,
            loadChildren: true,
          },
        );
        res.status(200).send(objects);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });

    initializePublicLearningObjectRouter({ router, dataStore: this.dataStore })

    initializeSingleFileDownloadRouter(router, this.dataStore, this.fileManager);

    router.use(
      '/learning-objects/stats',
      LearningObjectStatsRouteHandler.initialize({
        dataStore: this.dataStore,
        library: this.library,
      }),
    );
  }
}
