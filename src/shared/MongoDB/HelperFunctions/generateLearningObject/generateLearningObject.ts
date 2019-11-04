import { User, LearningObject, LearningOutcome } from '../../../entity';
import { LearningObjectDocument, UserToken } from '../../../types';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import { MongoConnector } from '../../MongoConnector';
import { LearningOutcomeMongoDatastore } from '../../../../LearningOutcomes/datastores/LearningOutcomeMongoDatastore';
import { learningObjectHasRevision } from '../learningObjectHasRevision/learningObjectHasRevision';
import { DataStore } from '../../../interfaces/DataStore';
import { ConfigurationServicePlaceholders } from 'aws-sdk/lib/config_service_placeholders';
import { requesterIsVerified, requesterIsEditor } from '../../../AuthorizationManager';

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
  requester?: UserToken,
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
    revisionUri: record.revisionUri,
    children,
    version: record.version,
  });

  const hasRevision = await learningObjectHasRevision(learningObject.cuid, learningObject.id);
  console.log(hasRevision);
  if (hasRevision && this.requester) {
    if (hasRevision && hasRevision.status === LearningObject.Status.UNRELEASED) {
      if ((learningObject.author.username === requester.username)) {
        learningObject.attachRevisionUri();
      }
    } else if (hasRevision.status === LearningObject.Status.PROOFING
                || hasRevision.status === LearningObject.Status.WAITING
                || hasRevision.status === LearningObject.Status.REVIEW) {
        if (requester.accessGroups.includes('admin') || requester.accessGroups.includes('editor') 
            || requester.accessGroups.includes(`curator@${learningObject.collection}`)
            || requester.accessGroups.includes(`reviewer@${learningObject.collection}`)) {

            learningObject.attachRevisionUri();
        }
    }
  }
  learningObject.attachResourceUris(process.env.GATEWAY_API);

  return learningObject;
}
