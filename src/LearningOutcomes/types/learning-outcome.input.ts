export class LearningOutcomeInput {
  bloom: string;
  verb: string;
  text?: string;
  mappings?: string[];
}

export class LearningOutcomeUpdate implements Partial<LearningOutcomeInput> {}
