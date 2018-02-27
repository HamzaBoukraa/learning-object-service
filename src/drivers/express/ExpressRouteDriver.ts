import { ExpressResponder } from '../drivers';
import { DataStore, Responder } from '../../interfaces/interfaces';
import { Router, Response } from 'express';
import { LearningObjectInteractor } from '../../interactors/interactors';
import { HashInterface } from '../../interfaces/interfaces';
import { User, LearningObject } from '@cyber4all/clark-entity';
const version = require('../../package.json').version;

export class ExpressRouteDriver {
  private _LearningObjectInteractor: LearningObjectInteractor;

  constructor(private dataStore: DataStore, private hasher: HashInterface) {
    this._LearningObjectInteractor = new LearningObjectInteractor(dataStore);
  }

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

    // FIXME: Convert to get and get author's username from token
    router.get(
      '/findLearningObject/:author/:learningObjectName',
      async (req, res) => {
        try {
          let username = req.params.author;
          let learningObjectName = req.params.learningObjectName;
          await this._LearningObjectInteractor.findLearningObject(
            this.getResponder(res),
            username,
            learningObjectName
          );
        } catch (e) {
          console.log(e);
        }
      }
    );

    // FIXME: Remove username from route and get username from token
    router.get('/loadLearningObjectSummary/:username', async (req, res) => {
      try {
        let username = req.params.username;
        await this._LearningObjectInteractor.loadLearningObjectSummary(
          this.getResponder(res),
          username
        );
      } catch (e) {
        console.log(e);
      }
    });

    router.get(
      '/loadLearningObject/:username/:learningObjectName',
      async (req, res) => {
        try {
          await this._LearningObjectInteractor.loadLearningObject(
            this.getResponder(res),
            req.params.username,
            req.params.learningObjectName
          );
        } catch (e) {
          console.log(e);
        }
      }
    );

    router.post('/addLearningObject', async (req, res) => {
      try {
        // FIXME: Get username from token
        let username = req.body.author;
        let object = LearningObject.unserialize(req.body.object);
        await this._LearningObjectInteractor.addLearningObject(
          this.getResponder(res),
          username,
          object
        );
      } catch (e) {
        console.log(e);
      }
    });

    router.patch('/updateLearningObject', async (req, res) => {
      try {
        let id = req.body.id;
        let object = LearningObject.unserialize(req.body.object);
        await this._LearningObjectInteractor.updateLearningObject(
          this.getResponder(res),
          id,
          object
        );
      } catch (e) {
        console.log(e);
      }
    });

    // FIXME: Take username out of route, get from token
    router.delete(
      '/deleteLearningObject/:username/:learningObjectName',
      async (req, res) => {
        try {
          let username = req.params.username;
          let learningObjectName = req.params.learningObjectName;
          await this._LearningObjectInteractor.deleteLearningObject(
            this.getResponder(res),
            username,
            learningObjectName
          );
        } catch (e) {
          console.log(e);
        }
      }
    );

    router.delete(
      '/deleteMultipleLearningObjects/:username/:learningObjectNames',
      async (req, res) => {
        try {
          let username = req.params.username;
          let learningObjectNames = req.params.learningObjectNames.split(',');

          await this._LearningObjectInteractor.deleteMultipleLearningObjects(
            this.getResponder(res),
            username,
            learningObjectNames
          );
        } catch (e) {
          console.log(e);
        }
      }
    );

    router.post('/reorderOutcome', async (req, res) => {
      try {
        let outcome = req.body.outcome;
        let object = req.body.object;
        let index = req.body.index;
        await this._LearningObjectInteractor.reorderOutcome(
          this.getResponder(res),
          object,
          outcome,
          index
        );
      } catch (e) {
        console.log(e);
      }
    });
    // FIXME: IMPLEMENT
    router.get('/suggestObjects', async (req, res) => {
      try {
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
        let currPage = req.query.currPage ? +req.query.currPage : null;
        let limit = req.query.limit ? +req.query.limit : null;

        await this._LearningObjectInteractor.suggestObjects(
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
      } catch (e) {
        console.log(e);
      }
    });

    router.get('/fetchAllObjects', async (req, res) => {
      try {
        let currPage = req.query.currPage ? +req.query.currPage : null;
        let limit = req.query.limit ? +req.query.limit : null;

        await this._LearningObjectInteractor.fetchAllObjects(
          this.getResponder(res),
          currPage,
          limit
        );
      } catch (e) {
        console.log(e);
      }
    });

    //Fetches Learing Objects By Username and LearningObject name
    router.post('/fetchMultipleObjects', async (req, res) => {
      try {
        let ids: { username: string; learningObjectName: string }[] =
          req.body.ids;
        await this._LearningObjectInteractor.fetchMultipleObjects(
          this.getResponder(res),
          ids
        );
      } catch (e) {
        console.log(e);
      }
    });

    //Fetches Learning Objects by IDs
    //FIXME: Need to validate token and that it is coming from cart service
    router.get('/fetchObjectsSummary/:ids', async (req, res) => {
      try {
        // FIXME: Should be of type string when typings are consistent
        let ids: any[] = req.params.ids.split(',');
        await this._LearningObjectInteractor.fetchObjectsByIDs(
          this.getResponder(res),
          ids
        );
      } catch (e) {
        console.log(e);
      }
    });

    //Fetches Learning Objects by IDs
    //FIXME: Need to validate token and that it is coming from cart service
    router.get('/fecthFullObjects/:ids', async (req, res) => {
      try {
        // FIXME: Should be of type string when typings are consistent
        let ids: any[] = req.params.ids.split(',');
        await this._LearningObjectInteractor.loadFullLearningObjectByIDs(
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
        await this._LearningObjectInteractor.fetchCollections(responder);
      } catch (e) {
        console.log(e);
      }
    });
    router.get('/collections/learning-objects', async (req, res) => {
      try {
        let responder = this.getResponder(res);
        await this._LearningObjectInteractor.fetchCollections(responder, true);
      } catch (e) {
        console.log(e);
      }
    });
    router.get('/collections/:name/learning-objects', async (req, res) => {
      try {
        let name = req.params.name;
        let responder = this.getResponder(res);
        await this._LearningObjectInteractor.fetchCollection(responder, name);
      } catch (e) {
        console.log(e);
      }
    });
  }
}
