import { LearningOutcomeDatastore } from './LearningOutcomeDataStore';
import { LearningOutcome } from '../../shared/entity';
import { LearningOutcomeUpdate, LearningOutcomeInsert } from '../types';

export class MockLearningOutcomeDatastore implements LearningOutcomeDatastore {
  insertLearningOutcome(params: { source: string, outcome: LearningOutcome }): Promise<string> {
    return Promise.resolve('test id');
  }

  getLearningOutcome(params: { id: string }): Promise<LearningOutcome> {
    return Promise.resolve(new LearningOutcome());
  }

  getAllLearningOutcomes(params: { source: string }): Promise<LearningOutcome[]> {
    // create a new array of length four, and fill it with instances of LearningOutcome
    return Promise.resolve(Array(4).fill((() => new LearningOutcome())()));
  }

  updateLearningOutcome(params: { id: string, updates: LearningOutcomeUpdate & LearningOutcomeInsert }): Promise<LearningOutcome> {
    return Promise.resolve(new LearningOutcome());
  }

  deleteLearningOutcome(params: { id: string }): Promise<void> {
    return Promise.resolve();
  }

  deleteAllLearningOutcomes(params: { source: string }) {
    return Promise.resolve();
  }
}
