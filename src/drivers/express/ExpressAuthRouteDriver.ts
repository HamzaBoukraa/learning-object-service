import { Router } from 'express';
import * as multer from 'multer';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { DZFile, DZFileMetadata } from '../../interfaces/FileManager';
import {
  DataStore,
  FileManager,
  LibraryCommunicator,
} from '../../interfaces/interfaces';
import {
  updateReadme,
  removeFile,
  updateFileDescription,
} from '../../LearningObjects/LearningObjectInteractor';
import * as FileInteractor from '../../FileManager/FileInteractor';
import * as LearningObjectRouteHandler from '../../LearningObjects/LearningObjectRouteHandler';
import * as LearningOutcomeRouteHandler from '../../LearningOutcomes/LearningOutcomeRouteHandler';
import * as SubmissionRouteDriver from '../../LearningObjectSubmission/SubmissionRouteDriver';
import { reportError } from '../SentryConnector';


export class ExpressAuthRouteDriver {
  private upload = multer({ storage: multer.memoryStorage() });

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
    const e = new ExpressAuthRouteDriver(dataStore, fileManager, library);
    const router: Router = Router();
    e.setRoutes(router);
    return router;
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

    SubmissionRouteDriver.initialize(router, this.dataStore);

    LearningObjectRouteHandler.initializePrivate({
        router,
        dataStore: this.dataStore,
        fileManager: this.fileManager,
        library: this.library,
      }),
    
    LearningOutcomeRouteHandler.initialize({router, dataStore: this.dataStore});

    router.get('/learning-objects/summary', async (req, res) => {
      try {
        const children = req.query.children;
        const objects = await LearningObjectInteractor.loadLearningObjectSummary(
          {
            dataStore: this.dataStore,
            library: this.library,
            username: req.user.username,
            accessUnpublished: true,
            loadChildren: children,
            query: req.query,
          },
        );
        res.status(200).send(objects);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
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
          console.error(e);
          res.status(500).send(e);
        }
      },
    );
    router.get(
      '/learning-objects/:username/:learningObjectName/id',
      async (req, res) => {
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
            res.status(200).send(id);
          } else {
            res
              .status(403)
              .send('Invalid Access. Cannot fetch Learning Object ID.');
          }
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      },
    );

    // FILE MANAGEMENT
    router
      .route('/learning-objects/:id/files/:fileId/multipart')
      .post(async (req, res) => {
        try {
          const user = req.user;
          const objectId: string = req.params.id;
          const filePath = req.body.filePath;
          const uploadId = await FileInteractor.startMultipartUpload({
            objectId,
            filePath,
            user,
            dataStore: this.dataStore,
            fileManager: this.fileManager,
          });
          res.status(200).send({ uploadId });
        } catch (e) {
          res.status(500).send(e);
        }
      })
      .patch(async (req, res) => {
        try {
          const id = req.params.id;
          const uploadId: string = req.body.uploadId;
          const fileMeta = req.body.fileMeta;
          const url = await FileInteractor.finalizeMultipartUpload({
            uploadId,
            dataStore: this.dataStore,
            fileManager: this.fileManager,
          });
          await LearningObjectInteractor.addFileMeta({
            id,
            fileMeta,
            url,
            dataStore: this.dataStore,
          });
          res.sendStatus(200);
        } catch (e) {
          res.status(500).send(e);
        }
      })
      .delete(async (req, res) => {
        try {
          const uploadId: string = req.body.uploadId;
          await FileInteractor.abortMultipartUpload({
            dataStore: this.dataStore,
            fileManager: this.fileManager,
            uploadId,
          });
          res.sendStatus(200);
        } catch (e) {
          res.status(500).send(e);
        }
      });

    router.post(
      '/learning-objects/:id/files',
      this.upload.any(),
      async (req, res) => {
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
            size: dzMetadata.dztotalfilesize || dzMetadata.size,
          };
          const uploadId = req.body.uploadId;
          const user = req.user;

          if (this.hasAccess(user, 'emailVerified', true)) {
            const loFile = await LearningObjectInteractor.uploadFile({
              id,
              username: user.username,
              dataStore: this.dataStore,
              fileManager: this.fileManager,
              file: upload,
              uploadId,
            });

            res.status(200).send(loFile);
          } else {
            res
              .status(403)
              .send(
                'Invalid Access. User must be verified to upload materials.',
              );
          }
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      },
    );
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
          console.error(e);
          res.status(500).send(e);
        }
      })
      .delete(async (req, res) => {
        try {
          const objectId = req.params.id;
          const fileId = req.params.fileId;
          const username = req.user.username;
          await removeFile({
            dataStore: this.dataStore,
            fileManager: this.fileManager,
            objectId,
            username,
            fileId,
          });
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
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
        console.error(e);
        res.status(500).send(e);
      }
    });
    router
      .route('/learning-objects/:username/:learningObjectName/children')
      .post(async (req, res) => {
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
            res.sendStatus(200);
          } else {
            res.status(403).send('Invalid Access. Could not add child object.');
          }
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      })
      .delete(async (req, res) => {
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
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      });
    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        try {
          const learningObjectNames = req.params.learningObjectNames.split(',');
          await LearningObjectInteractor.deleteMultipleLearningObjects(
            this.dataStore,
            this.fileManager,
            this.library,
            req.user.username,
            learningObjectNames,
          );
          res.sendStatus(200);
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      },
    );

    // TODO: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/summary', async (req, res) => {
      try {
        const ids: string[] = req.params.ids.split(',');
        const objects = await LearningObjectInteractor.fetchObjectsByIDs(
          this.dataStore,
          this.library,
          ids,
        );
        res.status(200).send(objects);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });

    // TODO: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/full', async (req, res) => {
      try {
        const ids: string[] = req.params.ids.split(',');
        const objects = await LearningObjectInteractor.loadFullLearningObjectByIDs(
          this.dataStore,
          this.library,
          ids,
        );
        res.status(200).send(objects);
      } catch (e) {
        console.error(e);
        res.status(500).send(e);
      }
    });
  }

  private hasAccess(token: any, propName: string, value: any): boolean {
    return token[propName] === value;
  }
}
