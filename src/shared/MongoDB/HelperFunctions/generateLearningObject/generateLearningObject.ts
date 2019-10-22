import { User, LearningObject, LearningOutcome } from '../../../entity';
import { LearningObjectDocument } from '../../../types';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import { MongoConnector } from '../../MongoConnector';
import { LearningOutcomeMongoDatastore } from '../../../../LearningOutcomes/datastores/LearningOutcomeMongoDatastore';

// TODO: Generating a full learning object should now entail generating files as well since they are an external resource
/**
 * Generates Learning Object from Document
 *
 * @private
 * @param {User} author
 * @param {LearningObjectDocument} record
 * @param {boolean} [full]
 * @returns {Promise<LearningObject>}
 * @memberof MongoDriver
 */
export async function generateLearningObject(
  author: User,
  record: LearningObjectDocument,
  full?: boolean,
): Promise<LearningObject> {
  const LEARNING_OUTCOME_DATASTORE = new LearningOutcomeMongoDatastore(
    MongoConnector.client().db('onion'),
  );
  // Logic for loading any learning object
  let learningObject: LearningObject;
  let materials: LearningObject.Material;
  let contributors: User[] = [];
  let outcomes: LearningOutcome[] = [];
  let children: LearningObject[] = [];
  // Load Contributors
  if (record.contributors) {
    if (record.contributors.length) {
      contributors = await Promise.all(
        record.contributors.map(userId =>
          UserServiceGateway.getInstance().queryUserById(userId),
        ),
      );
    }
  }
  // If full object requested, load up non-summary properties
  if (full) {
    // Logic for loading 'full' learning objects
    materials = <LearningObject.Material>record.materials;
    outcomes = await LEARNING_OUTCOME_DATASTORE.getAllLearningOutcomes({
      source: record._id,
    });
  }
  learningObject = new LearningObject({
    id: record._id,
    author,
    name: record.name,
    date: record.date,
    cuid: record.cuid,
    length: record.length as LearningObject.Length,
    levels: record.levels as LearningObject.Level[],
    collection: record.collection,
    status: record.status as LearningObject.Status,
    description: record.description,
    materials,
    contributors,
    outcomes,
    hasRevision: record.hasRevision,
    children,
    revision: record.revision,
  });

  learningObject.attachResourceUris(process.env.GATEWAY_API);

  return learningObject;
}
