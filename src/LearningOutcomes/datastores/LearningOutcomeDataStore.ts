import { LearningOutcome } from '../../shared/entity';
import { LearningOutcomeUpdate, LearningOutcomeInsert } from '../types';

export interface LearningOutcomeDatastore {
  insertLearningOutcome(params: {
    source: string;
    outcome: Partial<LearningOutcome>;
  }): Promise<string>;
  getLearningOutcome(params: { id: string }): Promise<LearningOutcome>;
  getAllLearningOutcomes(params: {
    source: string;
  }): Promise<LearningOutcome[]>;
  updateLearningOutcome(params: {
    id: string;
    updates: LearningOutcomeUpdate & LearningOutcomeInsert;
  }): Promise<LearningOutcome>;
  deleteLearningOutcome(params: { id: string }): Promise<void>;
  deleteAllLearningOutcomes(params: { source: string }): Promise<void>;
}