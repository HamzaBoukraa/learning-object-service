import {
    LearningObject,
    LearningOutcome,
} from '../../entity';

export interface LearningObjectSearchDocument {
    author: {
      name: string,
      username: string,
      email: string,
      organization: string,
    };
    collection: string;
    contributors: {
      name: string,
      username: string,
      email: string,
      organization: string,
    }[];
    date: string;
    description: string;
    id: string;
    length: string;
    levels: string[];
    name: string;
    outcomes: LearningOutcome[];
    revision: number;
    status: LearningObject.Status;
}
