import { LearningObject } from '../shared/entity';
import { LearningObjectSummary } from '../shared/types';

export interface RevisionsDataStore {
  createRevision(cuid: string, newRevisionId: number, revisionStatus?: LearningObject.Status.UNRELEASED | LearningObject.Status.PROOFING): Promise<void>;
}
