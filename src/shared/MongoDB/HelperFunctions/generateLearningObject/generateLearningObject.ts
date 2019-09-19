import { User, LearningObject, LearningOutcome } from '../../../entity';
import { LearningObjectDocument } from '../../../types';
import { UserServiceGateway } from '../../../gateways/user-service/UserServiceGateway';
import { MongoConnector } from '../../MongoConnector';
import { LearningOutcomeMongoDatastore } from '../../../../LearningOutcomes/datastores/LearningOutcomeMongoDatastore';

/**
 * Generates Learning Object from Document
 *
 * @private
 * @param {User} author
 * @param {LearningObjectDocument} document
 * @param {boolean} [full]
 * @returns {Promise<LearningObject>}
 * @memberof MongoDriver
 */
export async function generateInternalLearningObjectFromDocument(
  document: LearningObjectDocument,
): Promise<LearningObject> {

  let children: LearningObject[] = [];
  const materials = <LearningObject.Material>document.materials;
  const author = await loadAuthor(document.authorID);
  const contributors = await loadContributors(document);
  const outcomes = await loadOutcomes(document._id);

  const learningObject = new LearningObject({
    id: document._id,
    author,
    name: document.name,
    date: document.date,
    length: document.length as LearningObject.Length,
    levels: document.levels as LearningObject.Level[],
    collection: document.collection,
    status: document.status as LearningObject.Status,
    description: document.description,
    materials,
    contributors,
    outcomes,
    hasRevision: document.hasRevision,
    children,
    revision: document.revision,
  });
  return learningObject;
}

async function loadOutcomes(learningObjectID: string): Promise<LearningOutcome[]> {
  const LEARNING_OUTCOME_DATASTORE = new LearningOutcomeMongoDatastore(MongoConnector.client().db('onion'));
  return await LEARNING_OUTCOME_DATASTORE.getAllLearningOutcomes({
    source: learningObjectID,
  });
}

async function loadAuthor(authorID: string): Promise<User> {
  return await UserServiceGateway.getInstance().queryUserById(authorID);
}

async function loadContributors(document: LearningObjectDocument): Promise<User[]> {
  return await Promise.all(
    document.contributors.map(userId =>
      UserServiceGateway.getInstance().queryUserById(userId),
    ),
  );
}
