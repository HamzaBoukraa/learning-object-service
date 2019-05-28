import { PublishingDataStore } from './interactor';
import { LearningObject } from '../../shared/entity';
import { reportError } from '../../shared/SentryConnector';
import { ElasticSearchPublishingGateway } from './ElasticSearchPublishingGateway';

/**
 * This class is an abstraction point that allows us to use Mongo and
 * ElasticSearch side-by-side. It is written with the intent of ElasticSearch
 * running in "dark mode", where we index data into it but do not read data
 * out of it.
 */
export class ReleaseRequestDuplicator implements PublishingDataStore {
  elasticSearchStore: PublishingDataStore;
  constructor(private mongoStore: PublishingDataStore) {
    this.elasticSearchStore = new ElasticSearchPublishingGateway();
  }

  /**
   * Tries to index the Learning Object into ElasticSearch, then proceeds
   * to make the call to Mongo as normal. If the request to ElasticSearch
   * fails, we report the error and proceed as if nothing happened.
   *
   * @param releasableObject the Learning Object that should be released
   */
  async addToReleased(releasableObject: LearningObject): Promise<void> {
    try {
      await this.elasticSearchStore.addToReleased(releasableObject);
    } catch (e) {
      reportError(e);
    }
    return this.mongoStore.addToReleased(releasableObject);
  }
}
