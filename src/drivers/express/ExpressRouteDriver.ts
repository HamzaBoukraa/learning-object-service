import { ExpressResponder } from "../drivers";
import { DataStore, Responder } from "../../interfaces/interfaces";
import { Router, Response } from 'express';
import { AuthInteractor, UserInteractor, LearningObjectInteractor } from '../../interactors/interactors'
import { HashInterface } from "../../../interfaces/interfaces";
import { User, LearningObject } from "clark-entity";

export class ExpressRouteDriver {

    constructor(private dataStore: DataStore, private hasher: HashInterface) { }

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

            let auth = new AuthInteractor();
            await auth.authenticate(this.dataStore, this.getResponder(res), this.hasher, username, pwd);
        });
        router.post('/register', async (req, res) => {
            let auth = new AuthInteractor();
            let user = User.unserialize(req.body.user);
            await auth.registerUser(this.dataStore, this.getResponder(res), this.hasher, user);
        });
        // TODO: Combine into one route.
        router.post('/emailRegistered', async (req, res) => {
            let email = req.body.email;
            let auth = new AuthInteractor();
            await auth.emailRegisterd(this.dataStore, this.getResponder(res), email);
        });

        // USER ROUTES
        router.post('/findUser', async (req, res) => {
            let username = req.body.username;

            let user = new UserInteractor();
            await user.findUser(this.dataStore, this.getResponder(res), username);
        });
        router.post('/loadUser', async (req, res) => {
            let id = req.body.id;

            let user = new UserInteractor();
            await user.loadUser(this.dataStore, this.getResponder(res), id);
        });
        router.post('/editUser', async (req, res) => {
            let id = req.body.id;
            let user = User.unserialize(req.body.user);
            let userInteractor = new UserInteractor();
            await userInteractor.editUser(this.dataStore,this.getResponder(res),this.hasher,id,user);
        });
        router.post('/deleteUser', async (req, res) => {
            let id = req.body.id;
            let userInteractor = new UserInteractor();
            await userInteractor.deleteUser(this.dataStore,this.getResponder(res), id);
        });

        // LEARNING OBJECT ROUTES
        router.post('/findLearningObject', async (req, res) => {
            let author = req.body.author;
            let name = req.body.name;

            let learningObjectInteractor = new LearningObjectInteractor();
            await learningObjectInteractor.findLearningObject(this.dataStore, this.getResponder(res), author, name);
        });



        router.post('/loadLearningObjectSummary', async (req, res) => {
            let id = req.body.id;
            let learningObjectInteractor = new LearningObjectInteractor();
            await learningObjectInteractor.loadLearningObjectSummary(this.dataStore, this.getResponder(res), id)
        });

        router.post('/loadLearningObject', async (req, res) => {
            let id = req.body.id;
            let learningObjectInteractor = new LearningObjectInteractor();
            await learningObjectInteractor.loadLearningObject(this.dataStore, this.getResponder(res), id)
        });

        router.post('/addLearningObject', async (req, res) => {
            let author = req.body.author;
            let object = LearningObject.unserialize(req.body.object, null);
            let learningObjectInteractor = new LearningObjectInteractor();
            await learningObjectInteractor.addLearningObject(this.dataStore,this.getResponder(res),author,object);
        });

        

        router.post('/updateLearningObject', async (req, res) => {
            let id = req.body.id;
            let object = LearningObject.unserialize(req.body.object, null);
            let learningObjectInteractor = new LearningObjectInteractor();
            await learningObjectInteractor.updateLearningObject(this.dataStore,this.getResponder(res),id,object);

        });


        router.post('/deleteLearningObject', async (req, res) => {
            let id = req.body.id;
            let learningObjectInteractor = new LearningObjectInteractor();
            await learningObjectInteractor.deleteLearningObject(this.dataStore,this.getResponder(res),id)
        });

        router.post('/reorderOutcome', async (req, res) => {
            let outcome = req.body.outcome;
            let object = req.body.object;
            let index = req.body.index;
            let learningObjectInteractor = new LearningObjectInteractor();
            await learningObjectInteractor.reorderOutcome(this.dataStore,this.getResponder(res),object,outcome,index);
        });




    }

}