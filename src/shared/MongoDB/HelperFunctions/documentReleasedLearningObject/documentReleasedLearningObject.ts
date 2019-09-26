import { LearningObject } from '../../../entity';
import { LearningObjectDocument } from '../../../types';
import { ReleasedLearningObjectDocument } from '../../../types/learning-object-document';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';

/**
 * Converts Released Learning Object to Document
 *
 * @private
 * @param {LearningObject} object
 * @param {boolean} [isNew]
 * @param {string} [id]
 * @returns {Promise<LearningObjectDocument>}
 * @memberof MongoDriver
 */
export async function documentReleasedLearningObject(
  object: LearningObject,
): Promise<LearningObjectDocument> {
  const authorID = await UserServiceGateway.getInstance().findUser(object.author.username);
  let contributorIds: string[] = [];

  if (object.contributors && object.contributors.length) {
    contributorIds = await Promise.all(
      object.contributors.map(user => UserServiceGateway.getInstance().findUser(user.username)),
    );
  }

  const doc: ReleasedLearningObjectDocument = {
    _id: object.id,
    authorID: authorID,
    name: object.name,
    date: object.date,
    length: object.length,
    levels: object.levels,
    description: object.description,
    materials: object.materials,
    contributors: contributorIds,
    collection: object.collection,
    outcomes: object.outcomes.map(this.documentOutcome),
    status: object.status,
    children: object.children.map(obj => obj.id),
    revision: object.revision,
    cuid: object.cuid,
  };

  return doc;
}

