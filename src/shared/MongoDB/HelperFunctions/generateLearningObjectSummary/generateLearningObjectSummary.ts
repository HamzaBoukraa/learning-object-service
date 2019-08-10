import { LearningObjectDocument, LearningObjectSummary, LearningObjectChildSummary } from '../../../types';
import { mapLearningObjectToSummary, mapChildLearningObjectToSummary } from '../../../functions';

/**
 * Converts LearningObjectDocument to LearningObjectSummary
 *
 * @private
 * @param {LearningObjectDocument} record [Learning Object data]
 * @returns {Promise<LearningObjectSummary>}
 * @memberof MongoDriver
 */
export async function generateLearningObjectSummary(
  record: LearningObjectDocument,
): Promise<LearningObjectSummary> {
  const author$ = this.fetchUser(record.authorID);
  const contributors$ = Promise.all(
    record.contributors.map(id => this.fetchUser(id)),
  );
  const [author, contributors] = await Promise.all([author$, contributors$]);

  let children: LearningObjectChildSummary[] = [];
  if (record.children) {
    children = (await this.loadChildObjects({
      id: record._id,
      full: false,
      status: [],
    })).map(mapChildLearningObjectToSummary);
  }

  return mapLearningObjectToSummary({
    ...(record as any),
    author,
    contributors,
    children,
    id: record._id,
  });
}
