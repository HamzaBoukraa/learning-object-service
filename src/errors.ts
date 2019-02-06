export const LearningObjectError = {
    DUPLICATE_NAME: (name: string): string => {
      return `A learning object with name '${name}' already exists.`;
    },
    INVALID_ACCESS: (userAccessGroups: string[], requiredAccessGroups: string[]): string => {
        return 'User does not have authorization to perform this action';
    }
  };
