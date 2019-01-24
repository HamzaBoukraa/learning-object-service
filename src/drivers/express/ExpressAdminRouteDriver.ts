import { LearningObject } from '@cyber4all/clark-entity';
import { Router } from 'express';
import { AdminLearningObjectInteractor } from '../../interactors/interactors';
import { DataStore, FileManager, LibraryCommunicator } from '../../interfaces/interfaces';
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
const version = require('../../../package.json').version;

export class ExpressAdminRouteDriver {
  constructor(private dataStore: DataStore, private fileManager: FileManager, private library: LibraryCommunicator) { }

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

        const accessGroups = req.user.accessGroups;

        let learningObjects: { total: number; objects: LearningObject[] } | Error;

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
            accessGroups,
            orderBy,
            sortType,
            page,
            limit,
          );
        } else {
          learningObjects = await AdminLearningObjectInteractor.fetchAllObjects(
            this.dataStore,
            accessGroups,
            page,
            limit,
          );
        }
        res.status(200).send(learningObjects);
      } catch (e) {
        console.error(e);
        if (e.includes('Invalid Access')) {
          res.status(401).send(e);
        } else {
          res.status(500).send(e);
        }
      }
    });
    router.route('/learning-objects').patch(async(req, res) => {
      try {
        const learningObject = LearningObject.instantiate(req.body);
        const accessGroups = req.user.accessGroups;
        await AdminLearningObjectInteractor.updateLearningObject(
            this.dataStore,
            this.fileManager,
            learningObject.id,
            learningObject,
            accessGroups
          );
        res.sendStatus(200);
      } catch (e) {
        console.error(e);
        if (e.includes('Invalid Access')) {
          res.status(401).send(e);
        } else {
          res.status(500).send(e);
        }
      }
    });
    router.route('/learning-objects/:learningObjectId').get(async (req, res) => {
      try {
        const id = req.params.learningObjectId;
        const accessGroups = req.user.accessGroups;

        const learningObject = await AdminLearningObjectInteractor.loadFullLearningObject(
          this.dataStore,
          this.fileManager,
          this.library,
          accessGroups,
          id,
        );

        res.status(200).send(learningObject);
      } catch (e) {
        console.error(e);
        if (e.includes('Invalid Access')) {
          res.status(401).send(e);
        } else {
          res.status(500).send(e);
        }
      }
    });
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/publish',
      async (req, res) => {

        try {
          const id = req.body.id;
          const published = req.body.published;
          const accessGroups = req.user.accessGroups;

          await AdminLearningObjectInteractor.togglePublished(
            this.dataStore,
            req.params.username,
            id,
            published,
            accessGroups
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          if (e.includes('Invalid Access')) {
            res.status(401).send(e);
          } else {
            res.status(500).send(e);
          }
        }
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unpublish',
      async (req, res) => {

        try {
          const id = req.body.id;
          const published = req.body.published;
          const accessGroups = req.user.accessGroups;

          await AdminLearningObjectInteractor.togglePublished(
            this.dataStore,
            req.params.username,
            id,
            published,
            accessGroups
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          if (e.includes('Invalid Access')) {
            res.status(401).send(e);
          } else {
            res.status(500).send(e);
          }
        }
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/lock',
      async (req, res) => {
        try {
          const id = req.body.id;
          const lock = req.body.lock;
          const accessGroups = req.user.accessGroups;

          await AdminLearningObjectInteractor.toggleLock(
            this.dataStore,
            id,
            accessGroups,
            lock,
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          if (e.includes('Invalid Access')) {
            res.status(401).send(e);
          } else {
            res.status(500).send(e);
          }
        }
      },
    );
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/unlock',
      async (req, res) => {
        try {
          const id = req.body.id;
          const accessGroups = req.user.accessGroups;
          await AdminLearningObjectInteractor.toggleLock(this.dataStore, id, accessGroups);
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          if (e.includes('Invalid Access')) {
            res.status(401).send(e);
          } else {
            res.status(500).send(e);
          }
        }
      },
    );
    router.delete(
      '/users/:username/learning-objects/:learningObjectName',
      async (req, res) => {
        try {
          const accessGroups = req.user.accessGroups;
          const learningObjectName = req.params.learningObjectName;
          await AdminLearningObjectInteractor.deleteLearningObject(
            this.dataStore,
            this.fileManager,
            req.params.username,
            learningObjectName,
            this.library,
            accessGroups
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          if (e.includes('Invalid Access')) {
            res.status(401).send(e);
          } else {
            res.status(500).send(e);
          }
        }
      },
    );

    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        try {
          const accessGroups = req.user.accessGroups;
          const learningObjectNames = req.params.learningObjectNames.split(',');
          await AdminLearningObjectInteractor.deleteMultipleLearningObjects(
            this.dataStore,
            this.fileManager,
            this.library,
            req.params.username,
            learningObjectNames,
            accessGroups
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          if (e.includes('Invalid Access')) {
            res.status(401).send(e);
          } else {
            res.status(500).send(e);
          }
        }
      },
    );
  }
}
