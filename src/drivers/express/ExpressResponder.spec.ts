import { ExpressResponder } from '../drivers';
import { MockExpressResponse } from '../../tests/mock-drivers/express/MockExpressResponse';
import { Response } from 'express';
import { LearningObject } from '@cyber4all/clark-entity';

describe('ExpressResponder', () => {
  let responder: ExpressResponder;
  let res: Response;

  beforeEach(() => {
    res = new MockExpressResponse();
    responder = new ExpressResponder(res);
  });

  describe('#sendOperationError', () => {
    it('Emits on the spy subject when shouldReturn is true', done => {
      responder.shouldReturn = true;
      const sub = responder.spy.subscribe(response => {
        expect(response.error).toEqual('Server error encounter.');
        expect(response.status).toEqual(400);
        done();
      });
      responder.sendOperationError();
    });
  });

  describe('#sendObject', () => {
    it('should send emit a learning object on the spy subject when shouldReturn is true', done => {
      const learningObject = new LearningObject();
      responder.shouldReturn = true;
      const sub = responder.spy.subscribe(response => {
        expect(response).toBe(learningObject);
        done();
      });
      responder.sendObject(learningObject);
    });
  });
});
