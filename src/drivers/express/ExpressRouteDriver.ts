import { ExpressResponder } from '../drivers';
import { DataStore, Responder, FileManager } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { User, LearningObject } from '@cyber4all/clark-entity';
import * as TokenManager from '../TokenManager';
import * as multer from 'multer';
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
// tslint:disable-next-line:no-require-imports
const version = require('../../package.json').version;

export class ExpressRouteDriver {
  private upload = multer({ storage: multer.memoryStorage() });

  constructor(private dataStore: DataStore, private fileManager: FileManager) {}

  public static buildRouter(
    dataStore: DataStore,
    fileManager: FileManager,
  ): Router {
    const e = new ExpressRouteDriver(dataStore, fileManager);
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

    router
      .route('/learning-objects')
      .get(async (req, res) => {
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
          responder.sendOperationError(e);
        }
      })
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
          if (req.user.username !== object.author.username) {
            this.getResponder(res).sendOperationError('Access Denied');
            return;
          }
          await LearningObjectInteractor.updateLearningObject(
            this.dataStore,
            object.id,
            object,
          );
          responder.sendOperationSuccess();
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

        const user = await TokenManager.decode(req.cookies.presence);

        if (user.emailVerified) {
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
          responder.sendOperationError(
            `Invalid access. User must be verified to upload materials.`,
          );
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
    router.get(
      '/learning-objects/:username/:learningObjectName/id',
      async (req, res) => {
        const responder = this.getResponder(res);
        try {
          const username = req.params.username;
          const learningObjectName = req.params.learningObjectName;
          const id = await LearningObjectInteractor.findLearningObject(
            this.dataStore,
            username,
            learningObjectName,
          );
          responder.sendObject(id);
        } catch (e) {
          responder.sendOperationError(e);
        }
      },
    );
    router
      .route('/learning-objects/:username/:learningObjectName/children')
      .post(async (req, res) => {
        const responder = this.getResponder(res);
        try {
          await LearningObjectInteractor.addChild({
            dataStore: this.dataStore,
            childId: req.body.id,
            parentName: req.params.learningObjectName,
            username: req.params.username,
          });
          responder.sendOperationSuccess();
        } catch (e) {
          responder.sendOperationError(e);
        }
      })
      .delete(async (req, res) => {
        const responder = this.getResponder(res);
        try {
          await LearningObjectInteractor.removeChild({
            dataStore: this.dataStore,
            childId: req.body.id,
            parentName: req.params.learningObjectName,
            username: req.params.username,
          });
          responder.sendOperationSuccess();
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
    router
      .route('/learning-objects/:username/:learningObjectName')
      .get(async (req, res) => {
        const responder = this.getResponder(res);
        try {
          let accessUpublished = false;
          let username = req.params.username;
          const cookie = req.cookies.presence;
          if (req.params.username === 'null' && cookie) {
            const user = await TokenManager.decode(cookie);
            username = user.username;
            accessUpublished = true;
          }

          const object = await LearningObjectInteractor.loadLearningObject(
            this.dataStore,
            username,
            req.params.learningObjectName,
            accessUpublished,
          );
          responder.sendObject(object);
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

    // router.post('/reorderOutcome', async (req, res) => {
    //   try {
    //    const outcome = req.body.outcome;
    //    const object = req.body.object;
    //    const index = req.body.index;
    //     await LearningObjectInteractor.reorderOutcome(
    //       this.getResponder(res),
    //       object,
    //       outcome,
    //       index
    //     );
    //   } catch (e) {
    //     responder.sendOperationError(e)
    //   }
    // });

    // Fetches Learing Objects By Username and LearningObject name
    router.post('/learning-objects/multiple', async (req, res) => {
      const responder = this.getResponder(res);
      try {
        const ids: {
          username: string;
          learningObjectName: string;
        }[] =
          req.body.ids;
        const objects = await LearningObjectInteractor.fetchMultipleObjects(
          this.dataStore,
          ids,
        );
        responder.sendObject(objects);
      } catch (e) {
        responder.sendOperationError(e);
      }
    });

    // Fetches Learning Objects by IDs
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

    // Fetches Learning Objects by IDs
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
    router.get('/collections/:name/learning-objects', async (req, res) => {
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
