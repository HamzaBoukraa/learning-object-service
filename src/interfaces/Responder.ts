import { Response } from 'express';

export interface Responder {
  sendOperationSuccess(): void;
  sendOperationError(error?: string, status?: number): void;
  sendObject(object: any): void;
  unauthorized(message?: string): void;
  writeStream(attachment?: string): Response;
}
