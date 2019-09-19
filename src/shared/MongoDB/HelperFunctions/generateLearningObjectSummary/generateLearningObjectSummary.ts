import { LearningObjectDocument, LearningObjectSummary } from '../../../types';
import { mapLearningObjectToSummary } from '../../../functions';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import * as mongoHelperFunctions from '../';
import { LearningObject } from '../../../entity';

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
  const author$ = UserServiceGateway.getInstance().queryUserById(
    record.authorID,
  );
  const contributors$ = Promise.all(
    record.contributors.map(id =>
      UserServiceGateway.getInstance().queryUserById(id),
    ),
  );
  const [author, contributors] = await Promise.all([author$, contributors$]);

  return mapLearningObjectToSummary({
    ...(record as any),
    author,
    contributors,
    id: record._id,
  });
}
