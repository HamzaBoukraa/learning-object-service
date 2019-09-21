import { LearningObjectDocument, LearningObjectSummary } from '../../../types';
import { mapLearningObjectToSummary } from '../../../functions';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import * as mongoHelperFunctions from '..';
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
  const author$ = UserServiceGateway.getInstance().queryUserById(
    record.authorID,
  );
  const contributors$ = Promise.all(
    record.contributors.map(id =>
      UserServiceGateway.getInstance().queryUserById(id),
    ),
  );
  const [author, contributors] = await Promise.all([author$, contributors$]);
  let hasRevision = record.hasRevision;
  if (hasRevision == null) {
    hasRevision = await mongoHelperFunctions.learningObjectHasRevision(
      record.cuid,
    );
  }
  return mapLearningObjectToSummary({
    ...(record as any),
    author,
    contributors,
    hasRevision,
    id: record._id,
  });
}
