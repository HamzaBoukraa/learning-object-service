import { releaseLearningObject, PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import { ElasticMongoReleaseRequestDuplicator } from './ElasticMongoReleaseRequestDuplicator';
import { UserToken } from '../../shared/types';
import { LambdaGatewayFactory } from './ReleaseEmails/lambda-gateway-factory';
import { ModuleLearningObjectSubmissionGateway } from './ModuleLearningObjectSubmissionGateway';
import { LearningObjectSubmissionGateway } from './LearningObjectSubmissionGateway';
import { StubLearningObjectSubmissionGateway } from './StubLearningObjectSubmissionGateway';
import { LearningObjectSubmissionGatewayFactory } from './LearningObjectSubmissionGatewayFactory';

// FIXME: Replace with direct export of ElasticSearchPublishingGateway#releaseLearningObject
// once we do away with the released-objects collection in Mongo
const setupElasticToggle = ({
  userToken,
  dataStore,
  releasableObject,
  authorUsername,
}: {
  userToken: UserToken,
  authorUsername: string,
  dataStore: PublishingDataStore;
  releasableObject: LearningObject;
}) => {
  const toggle = new ElasticMongoReleaseRequestDuplicator(dataStore);
  const releaseEmailGateway = LambdaGatewayFactory.buildGateway();
  const learningObjectSubmissionGateway: LearningObjectSubmissionGateway = LearningObjectSubmissionGatewayFactory.buildGateway();
  releaseLearningObject({
    authorUsername,
    userToken,
    dataStore: toggle,
    releasableObject,
    releaseEmailGateway,
    learningObjectSubmissionGateway,
  });
};

export { setupElasticToggle as releaseLearningObject };
