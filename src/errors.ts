import { reportError } from './drivers/SentryConnector';

export enum ServiceErrorType {
  INTERNAL = 'InternalServiceError',
}
export class ServiceError extends Error {
  constructor(type: ServiceErrorType) {
    super('Internal Server Error');
    this.name = type;
  }
}

export enum ResourceErrorReason {
  INVALID_ACCESS = 'InvalidAccess',
  NOT_FOUND = 'NotFound',
  BAD_REQUEST = 'BadRequest',
}
export class ResourceError extends Error {
  constructor(message: string, type: ResourceErrorReason) {
    super(message);
    this.name = type;
  }
}

export function mapErrorToStatusCode(error: Error): { code: number, message: string } {
  const status = {
    code: 500,
    message: error.message,
  };
  switch (error.name) {
    case ResourceErrorReason.INVALID_ACCESS:
      status.code = 401;
      break;
    case ResourceErrorReason.NOT_FOUND:
      status.code = 404;
      break;
    case ServiceErrorType.INTERNAL:
      status.code = 500;
      break;
    default:
      reportError(error);
      status.code = 500;
      status.message = 'Internal Service Error';
  }

  return status;
}
