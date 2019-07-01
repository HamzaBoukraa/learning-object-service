import { releaseLearningObject, PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import { ElasticMongoReleaseRequestDuplicator } from './ElasticMongoReleaseRequestDuplicator';
import { UserToken } from '../../shared/types';
import { LambdaGatewayFactory } from './ReleaseEmails/lambda-gateway-factory';
import { BundlerModule } from './Bundler/BundlerModule';

// FIXME: Replace with direct export of ElasticSearchPublishingGateway#releaseLearningObject
// once we do away with the released-objects collection in Mongo
const setupElasticToggle = ({ userToken, dataStore, releasableObject }: {
  userToken: UserToken,
  dataStore: PublishingDataStore;
  releasableObject: LearningObject;
}) => {
  const toggle = new ElasticMongoReleaseRequestDuplicator(dataStore);
  const releaseEmailGateway = LambdaGatewayFactory.buildGateway();
  releaseLearningObject({ userToken, dataStore: toggle, releasableObject, releaseEmailGateway });
};

// Initialize dependencies
BundlerModule.initialize();

export { setupElasticToggle as releaseLearningObject };
