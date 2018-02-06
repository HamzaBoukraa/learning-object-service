import { ExpressResponder } from "../drivers";
import { DataStore, Responder } from "../../interfaces/interfaces";
import { Router, Response } from 'express';
import { AuthInteractor, UserInteractor, LearningObjectInteractor } from '../../interactors/interactors'
import { HashInterface } from "../../interfaces/interfaces";
import { User, LearningObject } from "@cyber4all/clark-entity";
import { ObjectID } from "bson";

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
        router.get('/findUser/:username', async (req, res) => {
            try {
                let username = req.params.username;
                this._UserInteractor.responder = this.getResponder(res);

                await this._UserInteractor.findUser(username);
            } catch (e) {
                console.log(e);
            }

        });
        router.get('/loadUser/:id', async (req, res) => {
            try {
                let id = req.params.id;
                this._UserInteractor.responder = this.getResponder(res);

                await this._UserInteractor.loadUser(id);

            } catch (e) {
                console.log(e);
            }

        });
        router.patch('/editUser', async (req, res) => {
            try {
                let id = req.body.id;
                let user = User.unserialize(req.body.user);
                this._UserInteractor.responder = this.getResponder(res);

                await this._UserInteractor.editUser(id, user);
            } catch (e) {
                console.log(e);
            }

        });
        router.delete('/deleteUser/:id', async (req, res) => {
            try {
                let id = req.body.id;
                this._UserInteractor.responder = this.getResponder(res);
                await this._UserInteractor.deleteUser(id);
            } catch (e) {
                console.log(e);
            }

        });

        // LEARNING OBJECT ROUTES
        // FIXME: Convert to get and get author's username from token
        router.get('/findLearningObject/:author/:learningObjectName', async (req, res) => {
            try {
                let username = req.params.author;
                let learningObjectName = req.params.learningObjectName;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.findLearningObject(username, learningObjectName);
            } catch (e) {
                console.log(e);
            }
        });



        // FIXME: Remove username from route and get username from token
        router.get('/loadLearningObjectSummary/:username', async (req, res) => {
            try {
                let username = req.params.username;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.loadLearningObjectSummary(username);
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
                // FIXME: Get username from token
                let username = req.body.author;
                console.log(req.body)
                let object = LearningObject.unserialize(req.body.object);
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.addLearningObject(username, object);
            } catch (e) {
                console.log(e);
            }

        });



        router.patch('/updateLearningObject', async (req, res) => {
            try {
                let id = req.body.id;
                let object = LearningObject.unserialize(req.body.object);
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.updateLearningObject(id, object);
            } catch (e) {
                console.log(e);
            }
        });

        // FIXME: Take username out of route, get from token
        router.delete('/deleteLearningObject/:username/:learningObjectName', async (req, res) => {
            try {
                let username = req.params.username;
                let learningObjectName = req.params.learningObjectName;

                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.deleteLearningObject(username, learningObjectName)

            } catch (e) {
                console.log(e);
            }

        });

        router.delete('/deleteMultipleLearningObjects/:username/:learningObjectNames', async (req, res) => {
            try {
                let username = req.params.username;
                let learningObjectNames = req.params.learningObjectNames.split(',');

                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.deleteMultipleLearningObjects(username, learningObjectNames);

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
        // FIXME: IMPLEMENT
        router.get('/suggestObjects', async (req, res) => {
            try {
                // FIXME: Conver to number
                let ascending = req.query.ascending;
                let name = req.query.name;
                let author = req.query.author;
                let length = req.query.length;
                let level = req.query.level;
                let source = req.query.source;

                //For broad searching | Search all fields to match inputed text
                let text = req.query.text;
                // let content = req.query.content;

                let currPage = req.query.currPage ? +req.query.currPage : null;
                let limit = req.query.limit ? +req.query.limit : null;

                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.suggestObjects(name, author, length, level, source, text, ascending, currPage, limit);
            } catch (e) {
                console.log(e);
            }

        });

        router.get('/fetchAllObjects', async (req, res) => {
            try {
                let currPage = req.query.currPage ? +req.query.currPage : null;
                let limit = req.query.limit ? +req.query.limit : null;

                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.fetchAllObjects(currPage, limit);
            } catch (e) {
                console.log(e);
            }
        });

        //Fetches Learing Objects By Username and LearningObject name
        router.post('/fetchMultipleObjects', async (req, res) => {
            try {
                let ids: { username: string, learningObjectName: string }[] = req.body.ids;
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.fetchMultipleObjects(ids);
            } catch (e) {
                console.log(e);
            }
        });

        //Fetches Learning Objects by IDs
        //FIXME: Need to validate token and that it is coming from cart service
        router.get('/fetchObjectsSummary/:ids', async (req, res) => {
            try {
                let ids: ObjectID[] = req.params.ids.split(',');
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.fetchObjectsByIDs(ids);
            } catch (e) {
                console.log(e);
            }
        });

        //Fetches Learning Objects by IDs
        //FIXME: Need to validate token and that it is coming from cart service
        router.get('/fecthFullObjects/:ids', async (req, res) => {
            try {
                let ids: ObjectID[] = req.params.ids.split(',');
                this._LearningObjectInteractor.responder = this.getResponder(res);
                await this._LearningObjectInteractor.loadFullLearningObjectByIDs(ids);
            } catch (e) {
                console.log(e);
            }
        })

    }

}