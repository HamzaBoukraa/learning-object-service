import { ExpressResponder } from '../drivers';
import { DataStore, Responder } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { LearningObject } from '@cyber4all/clark-entity';
import * as TokenManager from '../TokenManager';
import { LearningObjectQuery } from '../../interfaces/DataStore';
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressRouteDriver {
  constructor(private dataStore: DataStore) {}

  public static buildRouter(dataStore: DataStore): Router {
    const e = new ExpressRouteDriver(dataStore);
    const router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private getResponder(response: Response): Responder {
    return new ExpressResponder(response);
  }

  private setRoutes(router: Router): void {
    router.get('/', async (req, res) => {
      res.json({
        version,
        message: `Welcome to the Learning Objects' API v${version}`,
      });
    });

    router.route('/learning-objects').get(async (req, res) => {
      const responder = this.getResponder(res);

      try {
        const currPage = req.query.currPage ? +req.query.currPage : null;
        const limit = req.query.limit ? +req.query.limit : null;

        const name = req.query.name;
        const author = req.query.author;
        let length = req.query.length;
        length = length && !Array.isArray(length) ? [length] : length;
        let level = req.query.level;
        level = level && !Array.isArray(level) ? [level] : level;
        let standardOutcomes = req.query.standardOutcomes;
        standardOutcomes =
          standardOutcomes && !Array.isArray(standardOutcomes)
            ? [standardOutcomes]
            : standardOutcomes;

        // For broad searching | Search all fields to match inputed text
        const text = req.query.text;
        const orderBy = req.query.orderBy;
        const sortType = req.query.sortType ? +req.query.sortType : null;

        let learningObjects: { total: number; objects: LearningObject[] };

        const accessUpublished = false;

        if (
          name ||
          author ||
          length ||
          level ||
          standardOutcomes ||
          text ||
          orderBy ||
          sortType
        ) {
          learningObjects = await LearningObjectInteractor.searchObjects(
            this.dataStore,
            name,
            author,
            length,
            level,
            standardOutcomes,
            text,
            accessUpublished,
            orderBy,
            sortType,
            currPage,
            limit,
          );
        } else {
          learningObjects = await LearningObjectInteractor.fetchAllObjects(
            this.dataStore,
            currPage,
            limit,
          );
        }
        responder.sendObject(learningObjects);
      } catch (e) {
        console.log(e);
        responder.sendOperationError(e);
      }
    });
    router.get('/learning-objects/:id/parents', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const query: LearningObjectQuery = req.query;
        query.id = req.params.id;
        const parents = await LearningObjectInteractor.fetchParents({
          query,
          dataStore: this.dataStore,
        });
        responder.sendObject(parents);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router
      .route('/learning-objects/:username/:learningObjectName')
      .get(async (req, res) => {
        const responder = this.getResponder(res);
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
            username,
            req.params.learningObjectName,
            accessUnpublished,
          );
          responder.sendObject(object);
        } catch (e) {
          console.error(e);
          responder.sendOperationError(e);
        }
      });

    router.get('/collections', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const collections = await LearningObjectInteractor.fetchCollections(
          this.dataStore,
        );
        responder.sendObject(collections);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router.get('/collections/learning-objects', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const collections = await LearningObjectInteractor.fetchCollections(
          this.dataStore,
          true,
        );
        responder.sendObject(collections);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    /**
     * Return a full collection {name: string, abstracts: [], learningObjects: []}
     */
    router.get('/collections/:name', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const name = req.params.name;
        const collection = await LearningObjectInteractor.fetchCollection(
          this.dataStore,
          name,
        );
        responder.sendObject(collection);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    /**
     * Return a list of learningObjects from a collection
     */
    router.get('/collections/:name/learning-objects', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const objects = await LearningObjectInteractor.fetchCollectionObjects(
          this.dataStore,
          req.params.name,
        );
        responder.sendObject(objects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    /**
     * Return the name of a collection and a list of it's abstracts
     */
    router.get('/collections/:name/meta', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const collectionMeta = await LearningObjectInteractor.fetchCollectionMeta(
          this.dataStore,
          req.params.name,
        );
        responder.sendObject(collectionMeta);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router.get('/users/:username/learning-objects', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const objects = await LearningObjectInteractor.loadLearningObjectSummary(
          this.dataStore,
          req.params.username,
          false,
        );
        responder.sendObject(objects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
  }
}
