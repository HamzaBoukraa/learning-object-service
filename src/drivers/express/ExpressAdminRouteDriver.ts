import { ExpressResponder } from '../drivers';
import { DataStore, Responder, FileManager } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { AdminLearningObjectInteractor } from '../../interactors/interactors';
import { User, LearningObject } from '@cyber4all/clark-entity';
import * as TokenManager from '../TokenManager';
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
const version = require('../../package.json').version;

export class ExpressAdminRouteDriver {
  constructor(private dataStore: DataStore, private fileManager: FileManager) {}

  public static buildRouter(
    dataStore: DataStore,
    fileManager: FileManager,
  ): Router {
    const e = new ExpressAdminRouteDriver(dataStore, fileManager);
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
        message: `Welcome to the Learning Objects' Admin API v${version}`,
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

        let learningObjects: LearningObject[];

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
          learningObjects = await AdminLearningObjectInteractor.searchObjects(
            this.dataStore,
            name,
            author,
            length,
            level,
            standardOutcomes,
            text,
            orderBy,
            sortType,
            currPage,
            limit,
          );
        } else {
          learningObjects = await AdminLearningObjectInteractor.fetchAllObjects(
            this.dataStore,
            currPage,
            limit,
          );
        }
        responder.sendObject(learningObjects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/publish',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const id = req.body.id;
          const published = req.body.published;

          await AdminLearningObjectInteractor.togglePublished(
            this.dataStore,
            req.params.username,
            id,
            published,
          );
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unpublish',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const id = req.body.id;
          const published = req.body.published;

          await AdminLearningObjectInteractor.togglePublished(
            this.dataStore,
            req.params.username,
            id,
            published,
          );
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/lock',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const id = req.body.id;
          const lock = req.body.lock;

          await AdminLearningObjectInteractor.toggleLock(
            this.dataStore,
            id,
            lock,
          );
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unlock',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const id = req.body.id;
          await AdminLearningObjectInteractor.toggleLock(this.dataStore, id);
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
    router.delete(
      '/users/:username/learning-objects/:learningObjectName',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const learningObjectName = req.params.learningObjectName;
          await AdminLearningObjectInteractor.deleteLearningObject(
            this.dataStore,
            this.fileManager,
            req.params.username,
            learningObjectName,
          );
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );

    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const learningObjectNames = req.params.learningObjectNames.split(',');
          await AdminLearningObjectInteractor.deleteMultipleLearningObjects(
            this.dataStore,
            this.fileManager,
            req.params.username,
            learningObjectNames,
          );
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
  }
}
