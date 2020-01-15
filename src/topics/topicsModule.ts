import { expressServiceModule, ExpressServiceModule } from 'node-service-module';
import { TopicsDatastore } from './interfaces/datastore/TopicsDatastore';
import { MongoDBTopicsDatastore } from './drivers/MongoDB/MongoDBTopicsDatastore';

/**
 * Module responsible for handling file operations
 *
 * @export
 * @class topc
 * @extends {ExpressServiceModule}
 */
@expressServiceModule({
    expressRouter: null,
    providers: [
      { provide: TopicsDatastore, useClass: MongoDBTopicsDatastore },
    ],
  })
  export class TopicsModule extends ExpressServiceModule {}
