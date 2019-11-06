import { RevisionsDataStore } from '../../Revisions/RevisionsDataStore';
import { LearningObject } from '../../shared/entity';
import {LearningObjectSummary} from '../../shared/types';

export class MockRevisionsDataStore implements RevisionsDataStore {
  createRevision(cuid: string, newRevisionId: number, revisionStatus?: LearningObject.Status.UNRELEASED | LearningObject.Status.PROOFING): Promise<void> {
      return Promise.resolve();
  }
}
