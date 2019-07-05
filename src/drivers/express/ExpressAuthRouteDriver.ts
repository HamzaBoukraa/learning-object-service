import { Router } from 'express';
import * as multer from 'multer';
import { LearningObjectInteractor } from '../../interactors/interactors';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../../shared/interfaces/interfaces';
import {
  updateReadme,
  removeFile,
  updateFileDescription,
} from '../../LearningObjects/LearningObjectInteractor';
import * as LearningObjectRouteHandler from '../../LearningObjects/LearningObjectRouteHandler';
import * as LearningOutcomeRouteHandler from '../../LearningOutcomes/LearningOutcomeRouteHandler';
import * as SubmissionRouteDriver from '../../LearningObjectSubmission';
import * as ChangelogRouteHandler from '../../Changelogs/ChangelogRouteDriver';
import { reportError } from '../../shared/SentryConnector';
import { UserToken } from '../../shared/types';
import { ResourceErrorReason, mapErrorToResponseData } from '../../shared/errors';
export class ExpressAuthRouteDriver {
  private upload = multer({ storage: multer.memoryStorage() });

  constructor(
    private dataStore: DataStore,
    private fileManager: FileManager,
    private library: LibraryCommunicator,
  ) { }

  public static buildRouter(
    dataStore: DataStore,
    fileManager: FileManager,
    library: LibraryCommunicator,
  ): Router {
    const e = new ExpressAuthRouteDriver(dataStore, fileManager, library);
    const router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private setRoutes(router: Router): void {
    router.use((req, res, next) => {
      if (!req.user) {
        try {
          throw new Error(
            'The user property must be defined on the request object to access these routes.',
          );
        } catch (e) {
          reportError(e);
        }
      }
      // If the username in the cookie is not lowercase and error will be reported
      // and the value adjusted to be lowercase
      if (
        !req.user.SERVICE_KEY &&
        !(req.user.username === req.user.username.toLowerCase())
      ) {
        // This odd try/catch setup is so that we don't abort the current operation,
        // but still have Sentry realize that an error was thrown.
        try {
          throw new Error(
            `${
            req.user.username
            } was retrieved from the token. Should be lowercase`,
          );
        } catch (e) {
          reportError(e);
        }
        req.user.username = req.user.username.toLowerCase();
      }
      next();
    });

    SubmissionRouteDriver.initialize({
      router,
    });

    LearningObjectRouteHandler.initializePrivate({
      router,
      dataStore: this.dataStore,
      fileManager: this.fileManager,
      library: this.library,
    });

    LearningOutcomeRouteHandler.initialize({
      router,
      dataStore: this.dataStore,
    });

    ChangelogRouteHandler.initialize({
      router,
      dataStore: this.dataStore,
    });

    router.patch(
      '/learning-objects/:learningObjectId/collections',
      async (req, res) => {
        const learningObjectId = req.params.learningObjectId;
        const collection = req.body.collection;

        try {
          LearningObjectInteractor.addToCollection(
            this.dataStore,
            learningObjectId,
            collection,
          );
          res.sendStatus(200);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({message});
        }
      },
    );
    router.get(
      '/learning-objects/:username/:learningObjectName/id',
      async (req, res) => {
        try {
          const userToken = req.user;
          const username = req.params.username;
          const learningObjectName = req.params.learningObjectName;
          const id = await LearningObjectInteractor.getLearningObjectId({
            dataStore: this.dataStore,
            username,
            learningObjectName,
            userToken,
          });
          res.status(200).send(id);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({ message });
        }
      },
    );
    /**
     * @deprecated
     *
     * TODO: Deprecate route in favor of more restful `/users/:username/learning-objects/:learningObjectId/materials/files/:fileId` route
     */
    router
      .route('/files/:id/:fileId')
      .patch(async (req, res) => {
        try {
          const objectId = req.params.id;
          const fileId = req.params.fileId;
          const description = req.body.description;
          await updateFileDescription({
            fileId,
            objectId,
            description,
            dataStore: this.dataStore,
          });
          res.sendStatus(200);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({message});
        }
      });
    router.patch('/learning-objects/:id/pdf', async (req, res) => {
      try {
        const id = req.params.id;
        await updateReadme({
          id,
          dataStore: this.dataStore,
          fileManager: this.fileManager,
        });
        res.sendStatus(200);
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({message});
      }
    });
    router
      .route('/learning-objects/:username/:learningObjectName/children')
      .post(async (req, res) => {
        try {
          const username = req.params.username;
          const user: UserToken = req.user;

          await LearningObjectInteractor.setChildren({
            dataStore: this.dataStore,
            children: req.body.children,
            parentName: req.params.learningObjectName,
            username,
            userToken: user,
          });
          res.sendStatus(200);

        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({message});
        }
      })
      .delete(async (req, res) => {
        try {
          const user: UserToken = req.user;
          const username = req.params.username;
          await LearningObjectInteractor.removeChild({
            dataStore: this.dataStore,
            childId: req.body.id,
            parentName: req.params.learningObjectName,
            username,
            userToken: user,
          });
          res.sendStatus(200);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({message});
        }
      });
    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        try {
          const learningObjectNames = req.params.learningObjectNames.split(',');
          await LearningObjectInteractor.deleteMultipleLearningObjects({
            dataStore: this.dataStore,
            fileManager: this.fileManager,
            library: this.library,
            user: req.user,
            learningObjectNames,
          });
          res.sendStatus(200);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({message});
        }
      },
    );

    // TODO: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/summary', async (req, res) => {
      try {
        const ids: string[] = req.params.ids.split(',');
        const objects = await LearningObjectInteractor.fetchObjectsByIDs({
          dataStore: this.dataStore,
          library: this.library,
          ids,
        });
        res.status(200).send(objects.map(obj => obj.toPlainObject()));
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({message});
      }
    });

    // TODO: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/full', async (req, res) => {
      try {
        const ids: string[] = req.params.ids.split(',');
        const objects = await LearningObjectInteractor.fetchObjectsByIDs({
          dataStore: this.dataStore,
          library: this.library,
          ids,
          full: true,
        });
        res.status(200).send(objects.map(obj => obj.toPlainObject()));
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({message});
      }
    });
  }

  private hasAccess(token: any, propName: string, value: any): boolean {
    return token[propName] === value;
  }
}
