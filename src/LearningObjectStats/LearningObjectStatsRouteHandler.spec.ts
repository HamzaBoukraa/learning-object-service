import * as Learningobjectstatsroute from './LearningObjectStatsRouteHandler';
import {} from './LearningObjectStatsInteractor';
import * as supertest from 'supertest';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import { MongoDriver } from '../drivers/drivers';

let router = express.Router();
const app = express();
app.use(router);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
let request = supertest(app);
let dataStore: MongoDriver;

describe('LearningObjectStatsRouteHandler', () => {
    beforeAll(async() => {
        dataStore = await MongoDriver.build(global['__MONGO_URI__']);
        Learningobjectstatsroute.initialize({router, dataStore});
    });
    describe('GET /learning-objects/stats', () => {
        it('should return a 200 and the statistics for released objects', done => {
            request
            .get('/learning-objects/stats')
            .expect('Content-Type', /json/)
            .expect(200)
            .then(res => {
                expect(res.body).toBeInstanceOf(Object);
                done();
            });
        });
    });
    afterAll(() => {
        dataStore.disconnect();
    });
});
