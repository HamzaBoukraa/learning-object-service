import { LearningObject } from '../shared/entity';

export interface RevisionsDataStore {
  createRevision(cuid: string, newRevisionId: number, revisionStatus?: LearningObject.Status.UNRELEASED | LearningObject.Status.PROOFING): Promise<void>;
}
