import { generateToken } from '../../tests/mock-token-manager';
import * as LearningObjectRouteHandler from './LearningObjectRouteHandler';
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as supertest from 'supertest';
import { MockLibraryDriver } from '../../tests/mock-drivers/MockLibraryDriver';
import * as cookieParser from 'cookie-parser';
import { processToken, handleProcessTokenError } from '../../middleware';
import { LearningObject } from '../../shared/entity';
import { HierarchyAdapter } from '../Hierarchy/HierarchyAdapter';
import { BundlerModule } from '../Publishing/Bundler/BundlerModule';
import { Bundler } from '../Publishing/Bundler/interfaces';
import {
  BundleData,
  BundleExtension,
  Readable,
} from '../Publishing/Bundler/typings';
import { MockDataStore } from '../../tests/mock-drivers/MockDataStore';
import { LibraryCommunicator } from '../../shared/interfaces/interfaces';
import { LearningObjectsModule } from '../LearningObjectsModule';
import {
  FileMetadataGateway,
  FileManagerGateway,
  ReadMeBuilder,
} from '../interfaces';
import { StubFileManagerGateway } from '../gateways/FileManagerGateway/StubFileManagerGateway';
import { StubFileMetadataGateway } from '../gateways/FileMetadataGateway/StubFileMetadataGateway';
import { StubReadMeBuilder } from '../drivers/ReadMeBuilder/StubReadMeBuilder';
import { LearningObjectSubmissionAdapter } from '../../LearningObjectSubmission/adapters/LearningObjectSubmissionAdapter';
import { StubSubmissionPublisher } from '../../LearningObjectSubmission/StubSubmissionPublisher';

const app = express();
const router = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(processToken, handleProcessTokenError);
app.use(router);
const request = supertest(app);

describe('LearningObjectRouteHandler', () => {
  const dataStore = new MockDataStore();
  LearningObjectSubmissionAdapter.open(new StubSubmissionPublisher());
  const stubs = dataStore.stubs;
  let LibraryDriver: LibraryCommunicator;
  let token: string;

  class StubBundler implements Bundler {
    bundleData(params: {
      bundleData: BundleData[];
      extension: BundleExtension;
    }) {
      return Promise.resolve(new Readable());
    }
  }

  beforeAll(async () => {
    HierarchyAdapter.open(dataStore);
    LibraryDriver = new MockLibraryDriver();
    LearningObjectsModule.providers = [
      { provide: FileMetadataGateway, useClass: StubFileMetadataGateway },
      { provide: FileManagerGateway, useClass: StubFileManagerGateway },
      { provide: ReadMeBuilder, useClass: StubReadMeBuilder },
    ];
    LearningObjectsModule.initialize();
    BundlerModule.providers = [{ provide: Bundler, useClass: StubBundler }];
    BundlerModule.initialize();
    // FIXME: This user is both an admin and a reviewer@nccp
    token = generateToken(stubs.userToken);
    const authorization = {
      Cookie: `presence=${token}`,
      'Content-Type': 'application/json',
    };
    LearningObjectRouteHandler.initializePublic({
      router,
      dataStore,
      library: LibraryDriver,
    });
    LearningObjectRouteHandler.initializePrivate({
      router,
      dataStore,
      library: LibraryDriver,
    });
  });

  afterAll(() => {
    LearningObjectsModule.destroy();
  });

  describe('GET /learning-objects/:learningObjectId', () => {
    it('should return a learning object based on the id', done => {
      request
        .get(`/learning-objects/${stubs.learningObject.id}`)
        .expect(200)
        .then(res => {
          expect(res.text).toContain(`${stubs.learningObject.id}`);
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
    stubs.learningObject.status = LearningObject.Status.UNRELEASED;
    const userToken = generateToken({ ...stubs.userToken, accessGroups: null });
    it('should update the requested learning object and return a status of 204', done => {
      request
        .patch(`/learning-objects/${stubs.learningObject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ learningObject: { name: 'Java stuff' } })
        .expect(204)
        .then(res => {
          done();
        });
    });
    describe('when the payload contains status set to \'released\'', () => {
      describe('and the requester is an admin', () => {
        it('should update the requested Learning Object and return a status of 204', done => {
          stubs.learningObject.status = LearningObject.Status.PROOFING;
          const adminToken = generateToken({
            ...stubs.userToken,
            accessGroups: ['admin'],
          });
          request
            .patch(`/learning-objects/${stubs.learningObject.id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              learningObject: { status: LearningObject.Status.RELEASED },
            })
            .expect(204)
            .then(res => {
              done();
            });
        });
      });
      describe('and the requester is an editor', () => {
        it('should update the requested Learning Object and return a status of 204', done => {
          stubs.learningObject.status = LearningObject.Status.PROOFING;
          const editorToken = generateToken({
            ...stubs.userToken,
            accessGroups: ['editor'],
          });
          request
            .patch(`/learning-objects/${stubs.learningObject.id}`)
            .set('Authorization', `Bearer ${editorToken}`)
            .send({
              learningObject: { status: LearningObject.Status.RELEASED },
            })
            .expect(204)
            .then(res => {
              done();
            });
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
          expect(res).toBeDefined();
          done();
        });
    });
  });
  describe('DELETE /learning-objects/:learningObjectName', () => {
    it('should delete a learning object from the database and return a 200 status', done => {
      stubs.learningObject.status = LearningObject.Status.UNRELEASED;
      request
        .delete(`/learning-objects/${stubs.learningObject.name}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204)
        .then(() => {
          done();
        });
    });
  });
  afterAll(() => {
    BundlerModule.destroy();
    return dataStore.disconnect();
  });
});
