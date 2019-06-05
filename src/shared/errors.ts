import { reportError } from './SentryConnector';

/**
 * The reasons for which a ServiceError may be thrown.
 */
export enum ServiceErrorReason {
  INTERNAL = 'InternalServiceError',
}

/**
 * Defines an error that the service encountered when processing a request.
 */
export class ServiceError extends Error {
  constructor(type: ServiceErrorReason) {
    super('Internal Server Error');
    this.name = type;
  }
}

/**
 * The reasons for which a ResourceError may be thrown.
 */
export enum ResourceErrorReason {
  FORBIDDEN = 'Forbidden',
  INVALID_ACCESS = 'InvalidAccess',
  NOT_FOUND = 'NotFound',
  BAD_REQUEST = 'BadRequest',
}
/**
 * Defines an error involving a specific resource in the service.
 */
export class ResourceError extends Error {
  constructor(message: string, type: ResourceErrorReason) {
    super(message);
    this.name = type;
  }
}

/**
 * Takes an error object of any kind, and maps it to a status code and message.
 *
 * Any error that is not of type ResourceError or ServiceError will default to
 * an Internal Server Error. If a value is passed in that is not of type Error,
 * it will be reported and and processed as an Internal Server Error.
 * @param error the Error to map to HTTP information.
 * @returns information to convert an Error to a proper HTTP response.
 */
export function mapErrorToResponseData(error: Error): { code: number, message: string } {
  if (!(error instanceof Error)) {
    reportError(error);
    return { code: 500, message: 'Internal Server Error' };
  }
  const status = {
    code: 500,
    message: error.message,
  };
  switch (error.name) {
    case ResourceErrorReason.BAD_REQUEST:
      status.code = 400;
      break;
    case ResourceErrorReason.INVALID_ACCESS:
      status.code = 401;
      break;
    case ResourceErrorReason.FORBIDDEN:
      status.code = 403;
      break;
    case ResourceErrorReason.NOT_FOUND:
      status.code = 404;
      break;
    case ServiceErrorReason.INTERNAL:
      status.code = 500;
      break;
    default:
      reportError(error);
      status.code = 500;
      status.message = 'Internal Service Error';
  }
  return status;
}

/**
 * Takes an http status code and error message, and maps it to a defined ResourceError or ServiceError.
 *
 * Any status code that is not defined below will default to
 * a 500.
 * @param statusCode number represneting an http status code
 * @param message string error message
 * @returns ResourceError or ServiceError
 */
export function mapResponseDataToError(
  statusCode: number,
): ResourceError | ServiceError {
  switch (statusCode) {
    case 400:
      return new ResourceError(
        'Bad Request',
        ResourceErrorReason.BAD_REQUEST,
      );
    case 401:
      return new ResourceError(
        'Invalid Access',
        ResourceErrorReason.INVALID_ACCESS,
      );
    case 403:
      return  new ResourceError(
        'Forbidden',
        ResourceErrorReason.FORBIDDEN,
      );
    case 404:
      return  new ResourceError(
        'Resource Not Found',
        ResourceErrorReason.NOT_FOUND,
      );
    default:
      return new ServiceError(ServiceErrorReason.INTERNAL);
  }
}
