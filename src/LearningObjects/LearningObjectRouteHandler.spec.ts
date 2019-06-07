import { MongoDriver } from '../drivers/MongoDriver';
import { generateToken } from '../tests/mock-token-manager';
import * as LearningObjectRouteHandler from './LearningObjectRouteHandler';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as supertest from 'supertest';
import { MockLibraryDriver } from '../tests/mock-drivers/MockLibraryDriver';
import { MockS3Driver } from '../tests/mock-drivers/MockS3Driver';
import { LibraryCommunicator, FileManager } from '../shared/interfaces/interfaces';
import * as cookieParser from 'cookie-parser';
import { processToken, handleProcessTokenError } from '../drivers/express/middleware';
import { LearningObject } from '../shared/entity';
import { Stubs } from '../tests/stubs';

const app = express();
const router = express.Router();
const stubs = new Stubs();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(processToken, handleProcessTokenError);
app.use(router);
const request = supertest(app);
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
        // FIXME: This user is both an admin and a reviewer@nccp
        token = generateToken(stubs.userToken);
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
                .get(`/learning-objects/${stubs.learningObject.id}`)
                .expect(200)
                .then(res => {
                    expect(res.text).toContain(`${stubs.learningObject.id}`);
                    done();
                });
        });
        it('should return a status of 500 and an Error message', done => {
            request
                .get(`/learning-objects/${stubs.learningObject.id}123`)
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
                .get(`/learning-objects/${stubs.learningObject.id}/materials/all`)
                .expect(200)
                .then(res => {
                    expect(res.text).toContain('url');
                    done();
                });
        });
    });
    describe(`PATCH /learning-objects/:id`, () => {
        const userToken = generateToken({...stubs.userToken, accessGroups: null});
        it('should update the requested learning object and return a status of 200', done => {
            request
                .patch(`/learning-objects/${stubs.learningObject.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ learningObject: { name: 'Java stuff' } })
                .expect(200)
                .then(res => {
                    done();
                },
                );
        });
        describe('when the payload contains status set to \'released\'', () => {
            describe('and the requester is an admin', () => {
                it('should update the requested Learning Object and return a status of 200', done => {
                    const adminToken = generateToken({...stubs.userToken, accessGroups: ['admin']});
                    request
                        .patch(`/learning-objects/${stubs.learningObject.id}`)
                        .set('Authorization', `Bearer ${adminToken}`)
                        .send({ learningObject: { status: LearningObject.Status.RELEASED } })
                        .expect(200)
                        .then(res => {
                            done();
                        },
                        );
                });
            });
            describe('and the requester is an editor', () => {
                it('should update the requested Learning Object and return a status of 200', done => {
                    const editorToken = generateToken({...stubs.userToken, accessGroups: ['editor']});
                    request
                        .patch(`/learning-objects/${stubs.learningObject.id}`)
                        .set('Authorization', `Bearer ${editorToken}`)
                        .send({ learningObject: { status: LearningObject.Status.RELEASED } })
                        .expect(200)
                        .then(res => {
                            done();
                        },
                        );
                });
            });
            // TODO: Add case for non-editor/admin trying to update the status to released
        });
    });
    describe('GET /learning-objects/:id/children/summary', () => {
        it('should return the children of the parent object.', done => {
            request
                .get(`/learning-objects/${stubs.learningObject.id}/children/summary`)
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
    afterAll(() => dataStore.disconnect());
});
