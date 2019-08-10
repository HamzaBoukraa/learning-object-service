import { LearningObjectDocument, LearningObjectSummary, LearningObjectChildSummary } from '../../../types';
import { mapChildLearningObjectToSummary, mapLearningObjectToSummary } from '../../../functions';

/**
 * Converts LearningObjectDocument to LearningObjectSummary
 *
 * @private
 * @param {LearningObjectDocument} record [Learning Object data]
 * @returns {Promise<LearningObjectSummary>}
 * @memberof MongoDriver
 */
export async function generateReleasedLearningObjectSummary(
  record: LearningObjectDocument,
): Promise<LearningObjectSummary> {
  const author$ = this.fetchUser(record.authorID);
  const contributors$ = Promise.all(
    record.contributors.map(id => this.fetchUser(id)),
  );
  const [author, contributors] = await Promise.all([author$, contributors$]);
  let hasRevision = record.hasRevision;
  if (hasRevision == null) {
    hasRevision = await this.learningObjectHasRevision(record._id);
  }
  let children: LearningObjectChildSummary[] = [];
  if (record.children) {
    children = (await this.loadReleasedChildObjects({
      id: record._id,
      full: false,
    })).map(mapChildLearningObjectToSummary);
  }

  return mapLearningObjectToSummary({
    ...(record as any),
    author,
    contributors,
    children,
    hasRevision,
    id: record._id,
  });
}
