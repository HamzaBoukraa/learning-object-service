import { ExpressResponder } from '../drivers';
import { DataStore, Responder } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { HashInterface } from '../../interfaces/interfaces';
import { User, LearningObject } from '@cyber4all/clark-entity';
import * as TokenManager from '../TokenManager';
// This refers to the package.json that is generated in the dist. See /gulpfile.js for reference.
const version = require('../../package.json').version;

export class ExpressRouteDriver {
  constructor(private dataStore: DataStore, private hasher: HashInterface) {}

  public static buildRouter(
    dataStore: DataStore,
    hasher: HashInterface
  ): Router {
    let e = new ExpressRouteDriver(dataStore, hasher);
    let router: Router = Router();
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
        message: `Welcome to the Learning Objects' API v${version}`
      });
    });

    router
      .route('/learning-objects')
      .get(async (req, res) => {
        try {
          let currPage = req.query.currPage ? +req.query.currPage : null;
          let limit = req.query.limit ? +req.query.limit : null;

          let name = req.query.name;
          let author = req.query.author;
          let length = req.query.length;
          length = length && !Array.isArray(length) ? [length] : length;
          let level = req.query.level;
          level = level && !Array.isArray(level) ? [level] : level;
          let standardOutcomes = req.query.standardOutcomes;
          standardOutcomes =
            standardOutcomes && !Array.isArray(standardOutcomes)
              ? [standardOutcomes]
              : standardOutcomes;

          //For broad searching | Search all fields to match inputed text
          let text = req.query.text;
          // let content = req.query.content;

          let orderBy = req.query.orderBy;
          let sortType = req.query.sortType ? +req.query.sortType : null;

          if (
            name |
            author |
            length |
            level |
            standardOutcomes |
            text |
            orderBy |
            sortType
          ) {
            await LearningObjectInteractor.suggestObjects(
              this.dataStore,
              this.getResponder(res),
              name,
              author,
              length,
              level,
              standardOutcomes,
              text,
              orderBy,
              sortType,
              currPage,
              limit
            );
          } else {
            await LearningObjectInteractor.fetchAllObjects(
              this.dataStore,
              this.getResponder(res),
              currPage,
              limit
            );
          }
        } catch (e) {
          console.log(e);
        }
      })
      .post(async (req, res) => {
        try {
          let username = req.user.username;
          let object = LearningObject.instantiate(req.body.object);
          object.author.username = username;
          await LearningObjectInteractor.addLearningObject(
            this.dataStore,
            this.getResponder(res),
            object
          );
        } catch (e) {
          console.log(e);
        }
      })
      .patch(async (req, res) => {
        try {
          let object = LearningObject.instantiate(req.body.learningObject);
          if (req.user.username !== object.author.username) {
            this.getResponder(res).sendOperationError('Access Denied');
            return;
          }
          await LearningObjectInteractor.updateLearningObject(
            this.dataStore,
            this.getResponder(res),
            object.id,
            object
          );
        } catch (e) {
          console.log(e);
        }
      });

    // FIXME: Convert to get and get author's username from token
    router.get(
      '/learning-objects/:username/:learningObjectName/id',
      async (req, res) => {
        try {
          let username = req.params.username;
          let learningObjectName = req.params.learningObjectName;
          await LearningObjectInteractor.findLearningObject(
            this.dataStore,
            this.getResponder(res),
            username,
            learningObjectName
          );
        } catch (e) {
          console.log(e);
        }
      }
    );

    router.get('/learning-objects/summary', async (req, res) => {
      try {
        await LearningObjectInteractor.loadLearningObjectSummary(
          this.dataStore,
          this.getResponder(res),
          req.user.username
        );
      } catch (e) {
        console.log(e);
      }
    });
    router
      .route('/learning-objects/:username/:learningObjectName')
      .get(async (req, res) => {
        try {
          let accessUpublished = false;
          let username = req.params.username;
          let cookie = req.cookies.presence;
          if (req.params.username == 'null' && cookie) {
            let user = await TokenManager.decode(cookie);
            username = user.username;
            accessUpublished = true;
          }

          await LearningObjectInteractor.loadLearningObject(
            this.dataStore,
            this.getResponder(res),
            username,
            req.params.learningObjectName,
            accessUpublished
          );
        } catch (e) {
          console.log(e);
        }
      });
    router.delete('/learning-objects/:learningObjectName', async (req, res) => {
      try {
        let learningObjectName = req.params.learningObjectName;
        await LearningObjectInteractor.deleteLearningObject(
          this.dataStore,
          this.getResponder(res),
          req.user.username,
          learningObjectName
        );
      } catch (e) {
        console.log(e);
      }
    });

    router.delete(
      '/learning-objects/:learningObjectNames/multiple',
      async (req, res) => {
        try {
          let learningObjectNames = req.params.learningObjectNames.split(',');
          await LearningObjectInteractor.deleteMultipleLearningObjects(
            this.dataStore,
            this.getResponder(res),
            req.user.username,
            learningObjectNames
          );
        } catch (e) {
          console.log(e);
        }
      }
    );

    // router.post('/reorderOutcome', async (req, res) => {
    //   try {
    //     let outcome = req.body.outcome;
    //     let object = req.body.object;
    //     let index = req.body.index;
    //     await LearningObjectInteractor.reorderOutcome(
    //       this.getResponder(res),
    //       object,
    //       outcome,
    //       index
    //     );
    //   } catch (e) {
    //     console.log(e);
    //   }
    // });

    //Fetches Learing Objects By Username and LearningObject name
    router.post('/learning-objects/multiple', async (req, res) => {
      try {
        let ids: {
          username: string;
          learningObjectName: string;
        }[] =
          req.body.ids;
        await LearningObjectInteractor.fetchMultipleObjects(
          this.dataStore,
          this.getResponder(res),
          ids
        );
      } catch (e) {
        console.log(e);
      }
    });

    //Fetches Learning Objects by IDs
    //FIXME: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/summary', async (req, res) => {
      try {
        let ids: string[] = req.params.ids.split(',');
        await LearningObjectInteractor.fetchObjectsByIDs(
          this.dataStore,
          this.getResponder(res),
          ids
        );
      } catch (e) {
        console.log(e);
      }
    });

    //Fetches Learning Objects by IDs
    //FIXME: Need to validate token and that it is coming from cart service
    router.get('/cart/learning-objects/:ids/full', async (req, res) => {
      try {
        let ids: string[] = req.params.ids.split(',');
        await LearningObjectInteractor.loadFullLearningObjectByIDs(
          this.dataStore,
          this.getResponder(res),
          ids
        );
      } catch (e) {
        console.log(e);
      }
    });

    router.get('/collections', async (req, res) => {
      try {
        let responder = this.getResponder(res);
        await LearningObjectInteractor.fetchCollections(
          this.dataStore,
          responder
        );
      } catch (e) {
        console.log(e);
      }
    });
    router.get('/collections/learning-objects', async (req, res) => {
      try {
        let responder = this.getResponder(res);
        await LearningObjectInteractor.fetchCollections(
          this.dataStore,
          responder,
          true
        );
      } catch (e) {
        console.log(e);
      }
    });
    router.get('/collections/:name/learning-objects', async (req, res) => {
      try {
        let name = req.params.name;
        let responder = this.getResponder(res);
        await LearningObjectInteractor.fetchCollection(
          this.dataStore,
          responder,
          name
        );
      } catch (e) {
        console.log(e);
      }
    });
  }
}
