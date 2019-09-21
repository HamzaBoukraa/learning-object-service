import {
  LearningObjectDocument,
  LearningObjectSummary,
  LearningObjectChildSummary,
} from '../../../types';
import {
  mapLearningObjectToSummary,
  mapChildLearningObjectToSummary,
} from '../../../functions';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import * as mongoHelperFunctions from '../';

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

  let children: LearningObjectChildSummary[] = [];
  if (record.children) {
    children = (await mongoHelperFunctions.loadChildObjects({
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
