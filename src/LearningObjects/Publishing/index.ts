import { releaseLearningObject, PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import { ElasticMongoReleaseRequestDuplicator } from './ElasticMongoReleaseRequestDuplicator';
import { UserToken } from '../../shared/types';
import { LambdaGatewayFactory } from './lambda-gateway-factory';

// FIXME: Replace with direct export of ElasticSearchPublishingGateway#releaseLearningObject
// once we do away with the released-objects collection in Mongo
const setupElasticToggle = ({ userToken, dataStore, releasableObject }: {
  userToken: UserToken,
  dataStore: PublishingDataStore;
  releasableObject: LearningObject;
}) => {
  const toggle = new ElasticMongoReleaseRequestDuplicator(dataStore);
  const releaseEmailGateway = new LambdaGatewayFactory();
  releaseLearningObject({ userToken, dataStore: toggle, releasableObject, releaseEmailGateway: releaseEmailGateway.instance });
};

export { setupElasticToggle as releaseLearningObject };
