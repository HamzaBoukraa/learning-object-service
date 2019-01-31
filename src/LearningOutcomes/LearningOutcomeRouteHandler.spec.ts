import * as express from 'express';
import * as bodyParser from 'body-parser';
import { LearningOutcomeDatastore } from './LearningOutcomeInteractor';
import { LearningOutcomeInput, LearningOutcomeInsert, LearningOutcomeUpdate } from './types';
import { LearningOutcome } from '@cyber4all/clark-entity';
import * as supertest from 'supertest';
import * as LearningOutcomeRouteHandler from './LearningOutcomeRouteHandler';

const validOutcome = new LearningOutcome({ verb: 'remember', bloom: 'remember and understand', text: 'to brush your teeth' });

const dataStore: LearningOutcomeDatastore = {
  async insertLearningOutcome(params: { source: string, outcome: LearningOutcomeInput & LearningOutcomeInsert }) {
    return Promise.resolve('someid');
  },

  async getLearningOutcome(params: { id: string }) {
    return Promise.resolve(validOutcome);
  },

  async getAllLearningOutcomes(params: { source: string }) {
    return Promise.resolve([validOutcome, validOutcome]);
  },

  async updateLearningOutcome(params: { id: string, updates: LearningOutcomeUpdate & LearningOutcomeInsert }) {
    return Promise.resolve(validOutcome);
  },

  async deleteLearningOutcome(params: { id: string }) {
    return Promise.resolve();
  },

  async deleteAllLearningOutcomes(params: { source: string }) {
    return Promise.resolve();
  },
};

const app = express();
const router = express.Router();

LearningOutcomeRouteHandler.initialize({ router, dataStore });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(router);

const request = supertest(app);


describe('POST /learning-objects/:id/learning-outcomes', () => {

  it('should return a status of 200 and the id of the inserted outcome', (done) => {
    request
      .post('/learning-objects/someObjectId/learning-outcomes')
      .send({ outcome: { bloom: 'bloom', verb: 'verb' } })
      .expect('Content-Type', /text/)
      .expect(200, (err, res) => {
        expect(res.text).toBe('someid');
        done();
      });
  });
});

describe('GET /learning-objects/:id/learning-outcomes/:outcomeId', () => {

  it('should return a status of 200 and a Learning Outcome', (done) => {
    request.get('/learning-objects/someObjectId/learning-outcomes/someLearningOutcomeId')
    .expect('Content-Type', /json/)
    .expect(200, (err, res)  => {
      expect(() => {
        const _ = new LearningOutcome(res.body);
      }).not.toThrow();
      done();
    });
  });
});

describe('PATCH /learning-objects/:id/learning-outcomes/:outcomeId', () => {

  it('should return a status of 200 and a Learning Outcome', (done) => {
    request.patch('/learning-objects/someObjectId/learning-outcomes/someLearningOutcomeId')
      .send({ outcome: { bloom: 'bloom', verb: 'verb' } })
      .expect('Content-Type', /json/)
      .expect(200, (err, res) => {
        expect(() => {
          const _ = new LearningOutcome(res.body);
        }).not.toThrow();
        done();
      });
  });
});

describe('DELETE /learning-objects/:id/learning-outcomes/:outcomeId', () => {

  it('should return a status of 200', (done) => {
    request.delete('/learning-objects/:id/learning-outcomes/:outcomeId')
      .expect(200, (err, res) => {
        done();
      });
  });
});
