import { ExpressResponder } from '../drivers';
import { DataStore, Responder, FileManager } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { LearningObject } from '@cyber4all/clark-entity';
import * as multer from 'multer';

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
    router.get(
      '/learning-objects/:username/:learningObjectName/id',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const user = req.user;
          const username = req.params.username;
          const learningObjectName = req.params.learningObjectName;
          if (this.hasAccess(user, 'username', username)) {
            const id = await LearningObjectInteractor.findLearningObject(
              this.dataStore,
              user.username,
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
    router.post('/files', this.upload.any(), async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const files = req.files;
        let filePathMap = req.body.filePathMap
          ? JSON.parse(req.body.filePathMap)
          : null;
        if (filePathMap) {
          filePathMap = new Map<string, string>(filePathMap);
        }

        const user = req.user;

        if (this.hasAccess(user, 'emailVerified', true)) {
          const id = req.body.learningObjectID;
          const materials = await LearningObjectInteractor.uploadMaterials(
            this.fileManager,
            id,
            user.username,
            <any[]>files,
            filePathMap,
          );
          responder.sendObject(materials);
        } else {
          responder.unauthorized('User must be verified to upload materials.');
        }
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
            await LearningObjectInteractor.addChild({
              dataStore: this.dataStore,
              childId: req.body.id,
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

    // Fetches Learning Objects By Username and LearningObject name
    router.post('/learning-objects/multiple', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const user = req.user;
        let ids: {
          username: string;
          learningObjectName: string;
        }[] =
          req.body.ids;
        ids = ids.filter(id => this.hasAccess(user, 'username', id.username));
        const objects = await LearningObjectInteractor.fetchMultipleObjects(
          this.dataStore,
          ids,
        );
        responder.sendObject(objects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });

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
