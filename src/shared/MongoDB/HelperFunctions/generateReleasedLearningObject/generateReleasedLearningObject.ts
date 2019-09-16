import { User, LearningObject, LearningOutcome } from '../../../entity';
import { ReleasedLearningObjectDocument } from '../../../types/learning-object-document';
import { MongoConnector } from '../../MongoConnector';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import { LearningOutcomeMongoDatastore } from '../../../../LearningOutcomes/datastores/LearningOutcomeMongoDatastore';

/**
 * Generates released Learning Object from Document
 *
 * @private
 * @param {User} author
 * @param {ReleasedLearningObjectDocument} record
 * @param {boolean} [full]
 * @returns {Promise<LearningObject>}
 * @memberof MongoDriver
 */
export async function generateReleasedLearningObject(
  author: User,
  record: ReleasedLearningObjectDocument,
  full?: boolean,
): Promise<LearningObject> {
  const LEARNING_OUTCOME_DATASTORE = new LearningOutcomeMongoDatastore(
    MongoConnector.client().db('onion'),
  );
  let learningObject: LearningObject;
  let materials: LearningObject.Material;
  let contributors: User[] = [];
  let children: LearningObject[] = [];
  let outcomes: LearningOutcome[] = [];
  if (record.contributors && record.contributors.length) {
    contributors = await Promise.all(
      // TODO: Store contibutors as an array of usernames so that
      // we can fetch users from user service.
      record.contributors.map(userId =>
        UserServiceGateway.getInstance().queryUserById(userId),
      ),
    );
  }
  if (full) {
    materials = <LearningObject.Material>record.materials;
    for (let i = 0; i < record.outcomes.length; i++) {
      // FIXME: Direct access to a module's datastore couples the
      // module to this service.
      const mappings = await LEARNING_OUTCOME_DATASTORE.getAllStandardOutcomes({
        ids: record.outcomes[i].mappings,
      });
      outcomes.push(
        new LearningOutcome({
          ...record.outcomes[i],
          mappings: mappings,
          id: record.outcomes[i]['_id'],
        }),
      );
    }
  }
  learningObject = new LearningObject({
    id: record._id,
    author,
    name: record.name,
    date: record.date,
    length: record.length as LearningObject.Length,
    levels: record.levels as LearningObject.Level[],
    collection: record.collection,
    status: record.status as LearningObject.Status,
    description: record.description,
    materials,
    contributors,
    outcomes: outcomes,
    hasRevision: record.hasRevision,
    children,
    revision: record.revision,
  });
  return learningObject;
}
