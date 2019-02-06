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

    router.route('/learning-objects').get(async (req, res) => {
      res.redirect(301, req.originalUrl.replace('/admin/learning-objects', `/learning-objects`));
    });
    router.route('/learning-objects').patch(async (req, res) => {
      const learningObject = req.body.learningObject;
      const username = req.user.username;
      const newRoute = `/users/${username}/learning-objects/${learningObject.id}`;
      res.redirect(301, req.originalUrl.replace('/admin/learning-objects', newRoute));
    });
    router
      .route('/learning-objects/:learningObjectId')
      .get(async (req, res) => {
        res.redirect(301, req.originalUrl.replace('/admin/learning-objects', '/learning-objects'));
      });
    router.patch(
      '/users/:username/learning-objects/:learningObjectName/publish',
      async (req, res) => {
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
          const user = req.user;

          await AdminLearningObjectInteractor.toggleLock(
            this.dataStore,
            user,
            id,
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
          const user = req.user;
          await AdminLearningObjectInteractor.toggleLock(this.dataStore, user, id);
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
        console.log(req.originalUrl);
        const learningObjectName = req.params.learningObjectName;
        const username = req.user.username;
        res.redirect(301, req.originalUrl.replace(req.originalUrl, `/users/${username}/learning-objects/${learningObjectName}`));
      },
    );

    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        res.redirect(301, req.originalUrl.replace('/admin/learning-objects', `/learning-objects`));
      },
    );
  }
}
