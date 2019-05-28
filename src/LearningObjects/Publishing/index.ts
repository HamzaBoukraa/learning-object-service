import { releaseLearningObject, PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import { ReleaseRequestDuplicator } from './ReleaseRequestDuplicator';
import { UserToken } from '../../shared/types';

// FIXME: Replace with direct export of ElasticSearchPublishingGateway#releaseLearningObject
// once we do away with the released-objects collection in Mongo
const setupElasticToggle = ({ userToken, dataStore, releasableObject }: {
  userToken: UserToken,
  dataStore: PublishingDataStore;
  releasableObject: LearningObject;
}) => {
  const toggle = new ReleaseRequestDuplicator(dataStore);
  releaseLearningObject({ userToken, dataStore: toggle, releasableObject });
};

export { setupElasticToggle as releaseLearningObject };
