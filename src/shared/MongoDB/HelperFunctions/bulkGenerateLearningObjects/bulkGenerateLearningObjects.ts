import { LearningObjectDocument } from '../../../types';
import { LearningObject } from '../../../entity';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import * as mongoHelperFunctions from '..';

/**
 * Converts array of LearningObjectDocuments to Learning Objects
 *
 * @private
 * @param {LearningObjectDocument[]} docs
 * @returns {Promise<LearningObject[]>}
 * @memberof MongoDriver
 */
export async function bulkGenerateLearningObjects(
  docs: LearningObjectDocument[],
  full?: boolean,
): Promise<LearningObject[]> {
  return await Promise.all(
    docs.map(async doc => {
      const author = await UserServiceGateway.getInstance().queryUserById(
        doc.authorID,
      );
      const learningObject = await mongoHelperFunctions.generateLearningObject(
        author,
        doc,
        full,
      );
      return learningObject;
    }),
  );
}
