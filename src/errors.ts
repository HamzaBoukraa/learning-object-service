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
  };

export function determineErrorResponse(error: string): number {
  switch (error) {
    case LearningObjectError.INVALID_ACCESS():
      return 401;
    case LearningObjectError.RESOURCE_NOT_FOUND():
      return 404;
    default:
      return 500;
  }
}
