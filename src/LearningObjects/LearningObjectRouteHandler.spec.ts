import { MongoDriver } from '../drivers/MongoDriver';
import { MOCK_OBJECTS, SEED_DB_IDS} from '../tests/mocks';
import { generateToken } from '../tests/mock-token-manager';
import * as LearningObjectRouteHandler from './LearningObjectRouteHandler';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as supertest from 'supertest';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import { MockS3Driver } from '../tests/mock-drivers/MockS3Driver';
import { LibraryCommunicator, FileManager } from '../interfaces/interfaces';
import * as cookieParser from 'cookie-parser';
import { processToken, handleProcessTokenError } from '../middleware';

const app = express();
const router = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(processToken, handleProcessTokenError);
app.use(router);
const request = supertest(app);
const testObjectID = SEED_DB_IDS.PARENT.released_1;
describe('LearningObjectRouteHandler', () => {
    let dataStore: MongoDriver;
    let fileManager: FileManager;
    let LibraryDriver: LibraryCommunicator;
    let token: string;
    let authorization = {};
    beforeAll(async () => {
        dataStore = await MongoDriver.build(global['__MONGO_URI__']);
        fileManager = new MockS3Driver();
        LibraryDriver = new MockLibraryDriver();
        token = generateToken(MOCK_OBJECTS.USERTOKEN);
        authorization = { Cookie: `presence=${token}`, 'Content-Type': 'application/json' };
        LearningObjectRouteHandler.initializePublic({ router, dataStore });
        LearningObjectRouteHandler.initializePrivate({
            router,
            dataStore,
            fileManager,
            library: LibraryDriver,
        });
    });
    describe('GET /learning-objects/:learningObjectId', () => {

        it('should return a learing object based on the id', done => {
            request
                .get(`/learning-objects/${testObjectID}`)
                .expect(200)
                .then(res => {
                    expect(res.text).toContain(`${testObjectID}`);
                    done();
                });
        });
        it('should return a status of 500 and an Error message', done => {
            request
                .get(`/learning-objects/${testObjectID}123`)
                .expect(500)
                .then(res => {
                    expect(res).toBeDefined();
                    done();
                });
        });
    });
    describe(`GET /learning-objects/:someobjID/materials/all`, () => {
        it('should return the materials for the specified learning object', done => {
            request
                .get(`/learning-objects/${testObjectID}/materials/all`)
                .expect(200)
                .then(res => {
                    expect(res.text).toContain('url');
                    done();
                });
        });
    });
    describe(`PATCH /learning-objects/:id`, () => {

        it('should update the requested learning object and return a status of 200', done => {
            request
                .patch(`/learning-objects/${testObjectID}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ learningObject: { name: 'Java stuff' } })
                .expect(200)
                .then(res => {
                    done();
                },
                );
        });
    });
    describe('GET /learning-objects/:id/children/summary', () => {
        it('should return the children of the parent object.', done => {
            request
                .get(`/learning-objects/${testObjectID}/children/summary`)
                .expect(200)
                .then(res => {
                    expect(res.text).toContain('author');
                    done();
                });
        });
    });
    describe('DELETE /learning-objects/:learningObjectName', () => {

        it('should delete a learning object from the database and return a 200 status', done => {
            request
                .delete(`/learning-objects/Java%20stuff`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)
                .then(() => {
                    done();
                });
        });
    });
    afterAll(() => {
        dataStore.disconnect();
        console.log('Disconnected from Database');
    });
});