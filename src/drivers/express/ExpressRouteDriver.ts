import { ExpressResponder } from "../drivers";
import { DataStore, Responder } from "../../interfaces/interfaces";
import { Router, Response } from 'express';
import { AuthInteractor, UserInteractor, LearningObjectInteractor } from '../../interactors/interactors'
import { HashInterface } from "../../interfaces/interfaces";
import { User, LearningObject } from "clark-entity";

export class ExpressRouteDriver {

    private _LearningObjectInteractor: LearningObjectInteractor;
    private _AuthInteractor: AuthInteractor;
    private _UserInteractor: UserInteractor;

    constructor(private dataStore: DataStore, private hasher: HashInterface) {
        this._LearningObjectInteractor = new LearningObjectInteractor(dataStore);
        this._UserInteractor = new UserInteractor(dataStore, hasher);
        this._AuthInteractor = new AuthInteractor(dataStore, hasher);

    }

    public static buildRouter(dataStore: DataStore, hasher: HashInterface): Router {
        let e = new ExpressRouteDriver(dataStore, hasher);
        let router: Router = Router();
        e.setRoutes(router);
        return router
    }

    private getResponder(response: Response): Responder {
        return new ExpressResponder(response);
    }

    private setRoutes(router: Router): void {

        // AUTHENTICATION ROUTES
        router.post('/authenticate', async (req, res) => {
            let username = req.body.username;
            let pwd = req.body.pwd;
            this._AuthInteractor.responder = this.getResponder(res);

            await this._AuthInteractor.authenticate(username, pwd);
        });
        router.post('/register', async (req, res) => {
            let user = User.unserialize(req.body.user);
            this._AuthInteractor.responder = this.getResponder(res);
            await this._AuthInteractor.registerUser(user);
        });
        // TODO: Combine into one route.
        router.post('/emailRegistered', async (req, res) => {
            let email = req.body.email;
            this._AuthInteractor.responder = this.getResponder(res);

            await this._AuthInteractor.emailRegisterd(email);
        });

        // USER ROUTES
        router.post('/findUser', async (req, res) => {
            let username = req.body.username;
            this._UserInteractor.responder = this.getResponder(res);

            await this._UserInteractor.findUser(username);
        });
        router.post('/loadUser', async (req, res) => {
            let id = req.body.id;
            this._UserInteractor.responder = this.getResponder(res);

            await this._UserInteractor.loadUser(id);
        });
        router.post('/editUser', async (req, res) => {
            let id = req.body.id;
            let user = User.unserialize(req.body.user);
            this._UserInteractor.responder = this.getResponder(res);

            await this._UserInteractor.editUser(id, user);
        });
        router.post('/deleteUser', async (req, res) => {
            let id = req.body.id;
            this._UserInteractor.responder = this.getResponder(res);
            await this._UserInteractor.deleteUser(id);
        });

        // LEARNING OBJECT ROUTES
        router.post('/findLearningObject', async (req, res) => {
            let author = req.body.author;
            let name = req.body.name;
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.findLearningObject(author, name);
        });



        router.post('/loadLearningObjectSummary', async (req, res) => {
            let id = req.body.id;
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.loadLearningObjectSummary(id)
        });

        router.get('/loadLearningObject/:username/:learningObjectName', async (req, res) => {
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.loadLearningObject(req.params.username, req.params.learningObjectName)
        });

        router.post('/addLearningObject', async (req, res) => {
            let author = req.body.author;
            let object = LearningObject.unserialize(req.body.object, null);
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.addLearningObject(author, object);
        });



        router.post('/updateLearningObject', async (req, res) => {
            let id = req.body.id;
            let object = LearningObject.unserialize(req.body.object, null);
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.updateLearningObject(id, object);

        });


        router.post('/deleteLearningObject', async (req, res) => {
            let id = req.body.id;
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.deleteLearningObject(id)
        });

        router.post('/reorderOutcome', async (req, res) => {
            let outcome = req.body.outcome;
            let object = req.body.object;
            let index = req.body.index;
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.reorderOutcome(object, outcome, index);
        });

        router.post('/suggestObjects', async (req, res) => {
            let name = req.body.name;
            let author = req.body.author;
            let length = req.body.length;
            let level = req.body.level;
            let content = req.body.content;
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.suggestObjects(name, author, length, level, content);
        });

        router.get('/fetchAllObjects', async (req, res) => {

            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.fetchAllObjects();
        });

        router.post('/fetchMultipleObjects', async (req, res) => {
            let ids = req.body.ids;
            this._LearningObjectInteractor.responder = this.getResponder(res);
            await this._LearningObjectInteractor.fetchMultipleObjects(ids);
        });


    }

}