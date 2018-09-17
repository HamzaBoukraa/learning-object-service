import { ExpressResponder } from '../drivers';
import { DataStore, Responder, FileManager } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { LearningObject } from '@cyber4all/clark-entity';
import * as multer from 'multer';
import { DZFileMetadata, DZFile } from '../../interfaces/FileManager';
import { reportError } from '../SentryConnector';
export class ExpressAuthRouteDriver {
  private upload = multer({ storage: multer.memoryStorage() });

  constructor(private dataStore: DataStore, private fileManager: FileManager) {}

  public static buildRouter(
    dataStore: DataStore,
    fileManager: FileManager,
  ): Router {
    const e = new ExpressAuthRouteDriver(dataStore, fileManager);
    const router: Router = Router();
    e.setRoutes(router);
    return router;
  }

  private getResponder(response: Response): Responder {
    return new ExpressResponder(response);
  }

  private setRoutes(router: Router): void {
    router.use((req, res, next) => {
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
          console.log(e.message);
          reportError(e);
        }
        req.user.username = req.user.username.toLowerCase();
      }
      next();
    });
    router
      .route('/learning-objects')
      .post(async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const username = req.user.username;
          const object = LearningObject.instantiate(req.body.object);
          object.author.username = username;
          const learningObject = await LearningObjectInteractor.addLearningObject(
            this.dataStore,
            this.fileManager,
            object,
          );
          responder.sendObject(learningObject);
        } catch (e) {
          responder.sendOperationError(e);
        }
      })
      .patch(async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const object = LearningObject.instantiate(req.body.learningObject);
          const user = req.user;
          if (this.hasAccess(user, 'username', object.author.username)) {
            await LearningObjectInteractor.updateLearningObject(
              this.dataStore,
              this.fileManager,
              object.id,
              object,
            );
            responder.sendOperationSuccess();
          } else {
            responder.unauthorized('Could not update Learning Object');
          }
        } catch (e) {
          responder.sendOperationError(e);
        }
      });
    router.get('/learning-objects/summary', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const children = req.query.children;
        const objects = await LearningObjectInteractor.loadLearningObjectSummary(
          this.dataStore,
          req.user.username,
          true,
          children,
          req.query,
        );
        responder.sendObject(objects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router.patch('/learning-objects/publish', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const id = req.body.id;
        const published = req.body.published;

        await LearningObjectInteractor.togglePublished(
          this.dataStore,
          req.user.username,
          id,
          published,
        );
        responder.sendOperationSuccess();
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router.patch('/learning-objects/unpublish', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const id = req.body.id;
        const published = req.body.published;

        await LearningObjectInteractor.togglePublished(
          this.dataStore,
          req.user.username,
          id,
          published,
        );
        responder.sendOperationSuccess();
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router.patch('/learning-objects/:learningObjectId/collections', async (req, res) => {
        const responder = this.getResponder(res);
        const learningObjectId = req.params.learningObjectId;
        const collection = req.body.collection;

        try {
          LearningObjectInteractor.addToCollection(
            this.dataStore,
            learningObjectId,
            collection,
          );
          responder.sendOperationSuccess();
        } catch (e) {
          console.log(e);
          responder.sendOperationError(e);
        }
      });
    router.get(
      '/learning-objects/:username/:learningObjectName/id',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const user = req.user;
          const username = req.params.username;
          const learningObjectName = req.params.learningObjectName;
          if (this.hasAccess(user, 'username', username) || user.SERVICE_KEY) {
            const id = await LearningObjectInteractor.findLearningObject(
              this.dataStore,
              username,
              learningObjectName,
            );
            responder.sendObject(id);
          } else {
            responder.unauthorized('Cannot fetch Learning Object ID.');
          }
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
    router.post(
      '/learning-objects/:id/files',
      this.upload.any(),
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const file: Express.Multer.File = req.files[0];
          const id = req.params.id;
          const dzMetadata: DZFileMetadata = req.body;
          const upload: DZFile = {
            ...dzMetadata,
            name: file.originalname,
            encoding: file.encoding,
            buffer: file.buffer,
            mimetype: file.mimetype,
            size: dzMetadata.dztotalfilesize,
          };
          const user = req.user;

          if (this.hasAccess(user, 'emailVerified', true)) {
            const loFile = await LearningObjectInteractor.uploadFile({
              id,
              username: user.username,
              dataStore: this.dataStore,
              fileManager: this.fileManager,
              file: upload,
            });

            responder.sendObject(loFile);
          } else {
            responder.unauthorized(
              'User must be verified to upload materials.',
            );
          }
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
    router.delete('/learning-objects/:id/files', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const uploadStatusId = req.body.uploadId;
        await LearningObjectInteractor.cancelUpload({
          uploadStatusId,
          dataStore: this.dataStore,
          fileManager: this.fileManager,
        });

        responder.sendOperationSuccess();
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
    router.delete('/files/:id/:filename', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const id = req.params.id;
        const filename = req.params.filename;
        const username = req.user.username;
        await LearningObjectInteractor.deleteFile(
          this.fileManager,
          id,
          username,
          filename,
        );
        responder.sendOperationSuccess();
      } catch (e) {
        responder.sendOperationError(e);
      }
    });

    router
      .route('/learning-objects/:username/:learningObjectName/children')
      .post(async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const username = req.params.username;
          const user = req.user;
          if (this.hasAccess(user, 'username', username)) {
            await LearningObjectInteractor.setChildren({
              dataStore: this.dataStore,
              children: req.body.children,
              parentName: req.params.learningObjectName,
              username: user.username,
            });
            responder.sendOperationSuccess();
          } else {
            responder.unauthorized('Could not add child object.');
          }
        } catch (e) {
          responder.sendOperationError(e);
        }
      })
      .delete(async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const user = req.user;
          const username = req.params.username;
          if (this.hasAccess(user, 'username', username))
            await LearningObjectInteractor.removeChild({
              dataStore: this.dataStore,
              childId: req.body.id,
              parentName: req.params.learningObjectName,
              username: user.username,
            });
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      });
    router.delete('/learning-objects/:learningObjectName', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const learningObjectName = req.params.learningObjectName;
        await LearningObjectInteractor.deleteLearningObject(
          this.dataStore,
          this.fileManager,
          req.user.username,
          learningObjectName,
        );
        responder.sendOperationSuccess();
      } catch (e) {
        responder.sendOperationError(e);
      }
    });

    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const learningObjectNames = req.params.learningObjectNames.split(',');
          await LearningObjectInteractor.deleteMultipleLearningObjects(
            this.dataStore,
            this.fileManager,
            req.user.username,
            learningObjectNames,
          );
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );

    // TODO: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/summary', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const ids: string[] = req.params.ids.split(',');
        const objects = await LearningObjectInteractor.fetchObjectsByIDs(
          this.dataStore,
          ids,
        );
        responder.sendObject(objects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });

    // TODO: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/full', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const ids: string[] = req.params.ids.split(',');
        const objects = await LearningObjectInteractor.loadFullLearningObjectByIDs(
          this.dataStore,
          ids,
        );
        responder.sendObject(objects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });
  }

  private hasAccess(token: any, propName: string, value: any): boolean {
    return token[propName] === value;
  }
}
