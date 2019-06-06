import * as express from 'express';
import * as bodyParser from 'body-parser';
import { MongoDriver } from '../drivers/MongoDriver';
import * as supertest from 'supertest';
import * as LearningOutcomeRouteHandler from './LearningOutcomeRouteHandler';
import { LearningOutcome } from '../shared/entity';
import { LearningOutcomeDatastore } from './LearningOutcomeInteractor';
import { Stubs } from '../tests/stubs';

const app = express();
const router = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(router);
let dataStore: LearningOutcomeDatastore;
let driver: MongoDriver;
const request = supertest(app);
const stubs = new Stubs();

describe('LearningOutcomeRouteHandler', () => {
  beforeAll(async () => {
    driver = await MongoDriver.build(global['__MONGO_URI__']);
    dataStore = driver.learningOutcomeStore;
    LearningOutcomeRouteHandler.initialize({ router, dataStore });
  });
  describe('POST /learning-objects/:id/learning-outcomes', () => {
    it('should return a status of 200 and the id of the inserted outcome', done => {
      request
        .post('/learning-objects/someObjectId/learning-outcomes')
        .send({ outcome: { bloom: 'remember and understand', verb: 'remember' } })
        .expect('Content-Type', /text/)
        .expect(200)
        .then(res => {
          expect(typeof res.text).toBe('string');
          done();
        });
    });

    it('should return a status of 500 and an error message', done => {
      request
        .post('/learning-objects/someObjectId/learning-outcomes')
        .send({ outcome: { bloom: 'bad bloom', verb: 'badverb' } })
        .expect('Content-Type', /text/)
        .expect(500)
        .then(res => {
          expect(res.text).toMatch('Problem');
          done();
        });
    });
  });

  describe('GET /learning-objects/:id/learning-outcomes/:outcomeId', () => {
    it('should return a response body that can be converted to a valid Learning Outcome', done => {
      request
        .get(
          `/learning-objects/someObjectId/learning-outcomes/${stubs.learningOutcome.id}`,
        )
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          expect(() => {
            const _ = new LearningOutcome(res.body);
          }).not.toThrow();
          done();
        });
    });
  });

  describe('PATCH /learning-objects/:id/learning-outcomes/:outcomeId', () => {
    it('should return a status of 200 and a Learning Outcome', done => {
      request
        .patch(
          `/learning-objects/someObjectId/learning-outcomes/${stubs.learningOutcome.id}`,
        )
        .send({ outcome: { bloom: 'remember and understand', verb: 'remember' } })
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          expect(() => {
            const _ = new LearningOutcome(res.body);
          }).not.toThrow();
          done();
        });
    });

    it('should return a status of 500 and an error message', done => {
      request
        .patch(
          '/learning-objects/someObjectId/learning-outcomes/5af72b914803270dfc9aeae4',
        )
        .send({ outcome: { bloom: 'bad bloom', verb: 'badverb' } })
        .expect('Content-Type', /text/)
        .expect(500)
        .then(res => {
          expect(res.text).toMatch('Problem');
          done();
        });
    });
  });

  describe('DELETE /learning-objects/:id/learning-outcomes/:outcomeId', () => {
    it('should return a status of 204', done => {
      request
        .delete('/learning-objects/:id/learning-outcomes/:outcomeId')
        .expect(204)
        .then(res => {
          done();
        });
    });
  });
  afterAll(() => driver.disconnect());
});

