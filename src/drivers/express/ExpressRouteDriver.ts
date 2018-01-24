import { ExpressResponder } from "../drivers";
import { DataStore, Responder } from "../../interfaces/interfaces";
import { Router, Response } from 'express';
import { AuthInteractor, UserInteractor, LearningObjectInteractor } from '../../interactors/interactors'
import { HashInterface } from "../../interfaces/interfaces";
import { User, LearningObject } from "@cyber4all/clark-entity";

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

            try {
                let username = req.body.username;
                let pwd = req.body.pwd;
                this._AuthInteractor.responder = this.getResponder(res);

                await this._AuthInteractor.authenticate(username, pwd);

            } catch (e) {
                console.log(e);
            }

        });
        router.post('/register', async (req, res) => {
            try {
                let user = User.unserialize(req.body.user);
                this._AuthInteractor.responder = this.getResponder(res);
                await this._AuthInteractor.registerUser(user);
            } catch (e) {
                console.log(e);
            }

        });
        // TODO: Combine into one route.
        router.post('/emailRegistered', async (req, res) => {
            try {
                let email = req.body.email;
                this._AuthInteractor.responder = this.getResponder(res);

                await this._AuthInteractor.emailRegisterd(email);
            } catch (e) {
                console.log(e);
            }

        });

        // USER ROUTES
        router.post('/findUser', async (req, res) => {
            try {
                let username = req.body.username;
                this._UserInteractor.responder = this.getResponder(res);

                await this._UserInteractor.findUser(username);
            } catch (e) {
                console.log(e);
            }

        });
        router.post('/loadUser', async (req, res) => {
            try {
                let id = req.body.id;
                this._UserInteractor.responder = this.getResponder(res);

                await this._UserInteractor.loadUser(id);

            } catch (e) {
                console.log(e);
            }

        });
        router.post('/editUser', async (req, res) => {
            try {
                let id = req.body.id;
                let user = User.unserialize(req.body.user);
                this._UserInteractor.responder = this.getResponder(res);

                await this._UserInteractor.editUser(id, user);
            } catch (e) {
                console.log(e);
            }

        });
        router.post('/deleteUser', async (req, res) => {
            try {
                let id = req.body.id;
                this._UserInteractor.responder = this.getResponder(res);
                await this._UserInteractor.deleteUser(id);
            } catch (e) {
                console.log(e);
            }

        });

        // LEARNING OBJECT ROUTES
        router.post('/findLearningObject', async (req, res) => {
            try {
                let author = req.body.author;
                let name = req.body.name;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.findLearningObject(author, name);
            } catch (e) {
                console.log(e);
            }
        });



        router.post('/loadLearningObjectSummary', async (req, res) => {
            try {
                let id = req.body.id;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.loadLearningObjectSummary(id)
            } catch (e) {
                console.log(e);
            }

        });

        router.get('/loadLearningObject/:username/:learningObjectName', async (req, res) => {
            try {
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.loadLearningObject(req.params.username, req.params.learningObjectName)
            } catch (e) {
                console.log(e);
            }
        });

        router.post('/addLearningObject', async (req, res) => {
            try {
                let author = req.body.author;
                let object = LearningObject.unserialize(req.body.object);
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.addLearningObject(author, object);
            } catch (e) {
                console.log(e);
            }

        });



        router.post('/updateLearningObject', async (req, res) => {
            try {
                let id = req.body.id;
                let object = LearningObject.unserialize(req.body.object);
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.updateLearningObject(id, object);
            } catch (e) {
                console.log(e);
            }
        });


        router.post('/deleteLearningObject', async (req, res) => {
            try {
                let id = req.body.id;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.deleteLearningObject(id)

            } catch (e) {
                console.log(e);
            }

        });

        router.post('/reorderOutcome', async (req, res) => {
            try {
                let outcome = req.body.outcome;
                let object = req.body.object;
                let index = req.body.index;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.reorderOutcome(object, outcome, index);
            } catch (e) {
                console.log(e);
            }

        });

        router.post('/suggestObjects', async (req, res) => {
            try {
                let name = req.body.name;
                let author = req.body.author;
                let length = req.body.length;
                let level = req.body.level;
                let content = req.body.content;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.suggestObjects(name, author, length, level, content);
            } catch (e) {
                console.log(e);
            }

        });

        router.get('/fetchAllObjects', async (req, res) => {
            try {
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.fetchAllObjects();
            } catch (e) {
                console.log(e);
            }
        });

        router.post('/fetchMultipleObjects', async (req, res) => {
            try {
                let ids = req.body.ids;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.fetchMultipleObjects(ids);
            } catch (e) {
                console.log(e);
            }
        });

        router.get('/fetchObjects/:ids', async (req, res) => {
            try {
                let ids = req.params.ids.split(',');
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.fetchObjectsByIDs(ids);
            } catch (e) {
                console.log(e);
            }
        });

    }

}