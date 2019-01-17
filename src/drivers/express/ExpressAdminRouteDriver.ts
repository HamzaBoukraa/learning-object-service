import { LearningObject } from '@cyber4all/clark-entity';
import { Router } from 'express';
import { AdminLearningObjectInteractor } from '../../interactors/interactors';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../../interfaces/interfaces';
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressAdminRouteDriver {
  constructor(
    private dataStore: DataStore,
    private fileManager: FileManager,
    private library: LibraryCommunicator,
  ) {}

  public static buildRouter(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
  ): Router {
    const e = new ExpressAdminRouteDriver(dataStore, fileManager, library);
    const router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private setRoutes(router: Router): void {
    router.get('/', async (req, res) => {
      res.json({
        version,
        message: `Welcome to the Learning Objects' Admin API v${version}`,
      });
    });

    router.route('/learning-objects').get(async (req, res) => {
      try {
        const page = req.query.page ? +req.query.page : null;
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
            this.library,
            name,
            author,
            length,
            level,
            standardOutcomes,
            text,
            orderBy,
            sortType,
            page,
            limit,
          );
        } else {
          learningObjects = await AdminLearningObjectInteractor.fetchAllObjects(
            this.dataStore,
            page,
            limit,
          );
        }
        res.status(200).send(learningObjects.map(obj => obj.toPlainObject()));
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });
    router.route('/learning-objects').patch(async (req, res) => {
      const learningObject = new LearningObject(req.body);
      res.redirect(301, req.path.replace('/admin/learning-objects', `/learning-objects/${learningObject.id}`));
    });
    router
      .route('/learning-objects/:learningObjectId')
      .get(async (req, res) => {
        try {
          const id = req.params.learningObjectId;

          const learningObject: LearningObject = await AdminLearningObjectInteractor.loadFullLearningObject(
            this.dataStore,
            id,
          );

          res.status(200).send(learningObject.toPlainObject());
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      });
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/publish',
      async (_, res) => {
        // Respond to clients that this functionality is now gone
        res.sendStatus(410);
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unpublish',
      async (_, res) => {
        // Respond to clients that this functionality is now gone
        res.sendStatus(410);
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/lock',
      async (req, res) => {
        try {
          const id = req.body.id;
          const lock = req.body.lock;

          await AdminLearningObjectInteractor.toggleLock(
            this.dataStore,
            id,
            lock,
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unlock',
      async (req, res) => {
        try {
          const id = req.body.id;
          await AdminLearningObjectInteractor.toggleLock(this.dataStore, id);
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      },
    );
    router.delete(
      '/users/:username/learning-objects/:learningObjectName',
      async (req, res) => {
        try {
          const learningObjectName = req.params.learningObjectName;
          await AdminLearningObjectInteractor.deleteLearningObject(
            this.dataStore,
            this.fileManager,
            req.params.username,
            learningObjectName,
            this.library,
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      },
    );

    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        try {
          const learningObjectNames = req.params.learningObjectNames.split(',');
          await AdminLearningObjectInteractor.deleteMultipleLearningObjects(
            this.dataStore,
            this.fileManager,
            this.library,
            req.params.username,
            learningObjectNames,
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      },
    );
  }
}
