import { Router } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import {
  DataStore,
  LibraryCommunicator,
} from '../../shared/interfaces/interfaces';
import { updateReadme } from '../../LearningObjects/LearningObjectInteractor';
import * as LearningObjectRouteHandler from '../../LearningObjects/adapters/LearningObjectRouteHandler';
import * as LearningOutcomeRouteHandler from '../../LearningOutcomes/LearningOutcomeRouteHandler';
import * as SubmissionRouteDriver from '../../LearningObjectSubmission';
import * as ChangelogRouteHandler from '../../Changelogs/ChangelogRouteDriver';
import { reportError } from '../../shared/SentryConnector';
import { UserToken } from '../../shared/types';
import { mapErrorToResponseData } from '../../shared/errors';
export class ExpressAuthRouteDriver {
  constructor(
    private dataStore: DataStore,
    private library: LibraryCommunicator,
  ) {}

  public static buildRouter(
    dataStore: DataStore,
    library: LibraryCommunicator,
  ): Router {
    const e = new ExpressAuthRouteDriver(dataStore, library);
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
            `${req.user.username} was retrieved from the token. Should be lowercase`,
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
      library: this.library,
    });

    LearningOutcomeRouteHandler.initializePrivate({
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
          res.status(code).json({ message });
        }
      },
    );
    router.patch('/learning-objects/:id/pdf', async (req, res) => {
      try {
        const id = req.params.id;
        await updateReadme({
          requester: req.user,
          id,
          dataStore: this.dataStore,
        });
        res.sendStatus(200);
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({ message });
      }
    });
    router
      .route('/users/:username/learning-objects/:cuid/versions/:version/children')
      .post(async (req, res) => {
        try {
          const username = req.params.username;
          const user: UserToken = req.user;

          await LearningObjectInteractor.setChildren({
            dataStore: this.dataStore,
            children: req.body.children,
            cuid: req.params.cuid,
            version: req.params.version,
            username,
            userToken: user,
          });
          res.sendStatus(200);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({ message });
        }
      })
      .delete(async (req, res) => {
        try {
          const user: UserToken = req.user;
          const username = req.params.username;
          await LearningObjectInteractor.removeChild({
            dataStore: this.dataStore,
            childId: req.body.id,
            cuid: req.params.cuid,
            version: req.params.version,
            username,
            userToken: user,
          });
          res.sendStatus(200);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({ message });
        }
      });
    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        try {
          const learningObjectNames = req.params.learningObjectNames.split(',');
          await LearningObjectInteractor.deleteMultipleLearningObjects({
            dataStore: this.dataStore,
            library: this.library,
            user: req.user,
            learningObjectNames,
          });
          res.sendStatus(200);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({ message });
        }
      },
    );
    // FIXME: Why is this here??
    router.get(
      'users/:username/learning-objects/:cuid/versions/:version/id',
      async (req, res) => {
        try {
          const userToken = req.user;
          const username: string = req.params.username;
          const id = await LearningObjectInteractor.getLearningObjectId({
            dataStore: this.dataStore,
            username,
            cuid: req.params.cuid,
            version: req.params.version,
            userToken,
          });
          res.status(200).send(id);
        } catch (e) {
          const { code, message } = mapErrorToResponseData(e);
          res.status(code).json({ message });
        }
      },
    );

    // TODO: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/summary', async (req, res) => {
      try {
        const ids: string[] = req.params.ids.split(',');
        const objects = await LearningObjectInteractor.fetchObjectsByIDs({
          dataStore: this.dataStore,
          ids,
        });
        res.status(200).send(objects);
      } catch (e) {
        const { code, message } = mapErrorToResponseData(e);
        res.status(code).json({ message });
      }
    });
  }
}
