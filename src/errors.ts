export const LearningObjectError = {
  DUPLICATE_NAME: (name: string): string => {
    return `A learning object with name '${name}' already exists.`;
  },
};

