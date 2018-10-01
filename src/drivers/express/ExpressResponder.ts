import { Responder } from '../../interfaces/interfaces';
import { Response } from 'express';

export class ExpressResponder implements Responder {

  constructor(private res: Response) { }
  sendOperationSuccess(): void {
    this.res.sendStatus(200);
  }
  sendOperationError(
    error: string = 'Server error encounter.',
    status: number = 400,
  ): void {
    this.res.status(status).send(error);
  }
  sendObject(object: any): void {
    this.res.status(200).send(object);
  }

  unauthorized(message?: string) {
    this.res.status(403).send(`Invalid access. ${message}`.trim());
  }

  writeStream(attachment?: string): Response {
    if (attachment) {
      this.res.attachment(attachment);
    }
    return this.res;
  }
}
