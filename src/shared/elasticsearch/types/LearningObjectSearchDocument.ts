import { LearningObject, LearningOutcome } from '../../entity';

export interface LearningObjectSearchDocument {
  author: {
    name: string;
    username: string;
    email: string;
    organization: string;
  };
  collection: string;
  contributors: {
    name: string;
    username: string;
    email: string;
    organization: string;
  }[];
  date: string;
  description: string;
  cuid: string;
  id: string;
  length: string;
  levels: string[];
  name: string;
  outcomes: LearningOutcome[];
  version: number;
  status: LearningObject.Status;
}
