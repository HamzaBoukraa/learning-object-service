import { LearningObject, LearningOutcome } from '../../../entity';
import { LearningObjectDocument } from '../../../types';
import {
  ReleasedLearningObjectDocument,
  OutcomeDocument,
} from '../../../types/learning-object-document';
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
  const authorID = await UserServiceGateway.getInstance().findUser(
    object.author.username,
  );
  let contributorIds: string[] = [];

  if (object.contributors && object.contributors.length) {
    contributorIds = await Promise.all(
      object.contributors.map(user =>
        UserServiceGateway.getInstance().findUser(user.username),
      ),
    );
  }

  // TODO: REFACTOR ME PLEASE.
  if (object.materials && object.materials.files) {
      object.materials.files = [];
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
    outcomes: object.outcomes.map(documentOutcome),
    status: object.status,
    children: object.children.map(obj => obj.id),
    version: object.version,
    cuid: object.cuid,
  };

  return doc;
}

/**
 * Converts Learning Outcome into OutcomeDocument
 *
 * @private
 * @param {LearningOutcome} outcome [Learning Outcome to convert to OutcomeDocument]
 * @returns {OutcomeDocument}
 * @memberof MongoDriver
 */
function documentOutcome(outcome: LearningOutcome): OutcomeDocument {
  return {
    id: outcome.id,
    outcome: outcome.outcome,
    bloom: outcome.bloom,
    verb: outcome.verb,
    text: outcome.text,
    mappings: outcome.mappings.map(guideline => guideline.id),
  };
}
