export const LEARNING_OUTCOME_ERROR_MESSAGES = {
    INVALID_BLOOM(bloom: string) {
      return `${bloom} is not a valid Bloom taxon.`;
    },
    INVALID_MAPPING: 'Mapping must be defined.',
    INVALID_MAPPINGS: 'Mappings must not be undefined.',
    INVALID_TEXT: 'Text must be defined.',
    INVALID_VERB(bloom: string, verb: string) {
      return `${verb} is not a valid verb for the ${bloom} taxon.`;
    },
  };

export const SUBMITTABLE_LEARNING_OUTCOME_ERROR_MESSAGES = {
    INVALID_TEXT: 'Text must not be an empty string.',
  };
