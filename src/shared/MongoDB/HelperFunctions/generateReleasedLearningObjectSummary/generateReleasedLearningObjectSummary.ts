import { LearningObjectDocument, LearningObjectSummary, LearningObjectChildSummary } from '../../../types';
import { mapChildLearningObjectToSummary, mapLearningObjectToSummary } from '../../../functions';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import { loadReleasedChildObjects, learningObjectHasRevision } from '..';
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
  const author$ = UserServiceGateway.getInstance().queryUserById(record.authorID);
  const contributors$ = Promise.all(
    record.contributors.map(id => UserServiceGateway.getInstance().queryUserById(id)),
  );
  const [author, contributors] = await Promise.all([author$, contributors$]);
  let hasRevision = record.hasRevision;
  if (hasRevision == null) {
    hasRevision = await learningObjectHasRevision(record._id);
  }
  let children: LearningObjectChildSummary[] = [];
  if (record.children) {
    children = (await loadReleasedChildObjects({
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