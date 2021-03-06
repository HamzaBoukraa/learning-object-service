export const LEARNING_OBJECT_ERRORS = {
    INVALID_CHILD: 'Child object must be defined.',
    INVALID_CHILDREN: 'Children must not be undefined.',
    INVALID_COLLECTION: 'Collection must be defined.',
    INVALID_CONTRIBUTOR: 'Contributor must be defined.',
    INVALID_CONTRIBUTORS: 'Contributors must not be undefined.',
    INVALID_DESCRIPTION: 'Description must be defined.',
    INVALID_LENGTH(length: any) {
      if (!length) {
        return 'Length must be defined.';
      }
      return `${length} is not a valid length.`;
    },
    LEVEL_EXISTS(level: any) {
      return `${level} has already been added.`;
    },
    INVALID_LEVEL(level: any) {
      return `${level} is not a valid level.`;
    },
    LEVEL_DOES_NOT_EXIST(level: any) {
      return `${level} does not exist on this object.`;
    },
    INVALID_LEVELS: 'Levels must contain at least one valid academic level.',
    INVALID_MATERIAL: 'Material must be defined.',
    INVALID_METRICS: 'Metrics must be defined.',
    INVALID_NAME:
      'Name must be a defined string more than two characters and less than fifty characters.',
    INVALID_OBJECT: 'Learning Object must not be undefined',
    INVALID_OUTCOMES: 'Outcomes must not be undefined.',
    INVALID_STATUS(status: any) {
      if (!status) {
        return 'Status must be defined.';
      }
      return `${status} is not a valid status.`;
    },
  };

export const SUBMITTABLE_LEARNING_OBJECT_ERRORS = {
    INVALID_DESCRIPTION: 'Description must not be an empty string.',
    INVALID_OUTCOMES: 'Outcomes must contain at least one valid outcome.',
  };
