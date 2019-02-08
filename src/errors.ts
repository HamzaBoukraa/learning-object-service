import { reportError } from './drivers/SentryConnector';

export const LearningObjectError = {
    DUPLICATE_NAME: (name: string): string => {
      return `A learning object with name '${name}' already exists.`;
    },
    INVALID_ACCESS: (): string => {
        return 'User does not have authorization to perform this action';
    },
    RESOURCE_NOT_FOUND: (): string => {
      return 'The requested resource does not exist';
    },
    INTERNAL_ERROR: (): string => {
      return 'An internal server error has occured';
    },
  };

export function mapErrorToStatusCode(error: Error): { code: number, message: string } {
  const status = {
    code: 500,
    message: error.message,
  };
  switch (error.message) {
    case LearningObjectError.INVALID_ACCESS():
      status.code = 401;
      break;
    case LearningObjectError.RESOURCE_NOT_FOUND():
      status.code = 404;
      break;
    case LearningObjectError.INTERNAL_ERROR():
      status.code = 500;
      break;
    default:
      reportError(error);
      status.code = 500;
      status.message = LearningObjectError.INTERNAL_ERROR();
  }

  return status;
}
