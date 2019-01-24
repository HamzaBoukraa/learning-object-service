export const LearningObjectError = {
    DUPLICATE_NAME: (name: string): string => {
      return `A learning object with name '${name}' already exists.`;
    },
    INVALID_ACCESS: (userAccessGroups: string[], requiredAccessGroups: string[]): string => {
        return `Invalid Access. Current user access groups: ${userAccessGroups.join()}. Required access groups: ${requiredAccessGroups.join()}.`
    }
  };
