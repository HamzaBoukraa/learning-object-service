import { Responder } from '../../interfaces/interfaces';
import { Response } from 'express';
import { Subject } from 'rxjs';
import { LearningObject } from '@cyber4all/clark-entity';

export class ExpressResponder implements Responder {

  spy: Subject<any>;
  shouldReturn: boolean;

  constructor(private res: Response) {
    this.spy = new Subject<any>();
  }
  sendOperationSuccess(): void {
    this.res.sendStatus(200);
  }
  sendOperationError(
    error: string = 'Server error encounter.',
    status: number = 400,
  ): void {
    if (this.shouldReturn) {
      this.spy.next({ error, status });
    } else {
      this.res.status(status).send(error);
    }
  }
  sendObject(object: any): void {
    if (this.shouldReturn) {
      this.spy.next(object);
    } else {
      this.res.status(200).send(object);
    }
  }
}
