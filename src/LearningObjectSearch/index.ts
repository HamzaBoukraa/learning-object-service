import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { LearningObjectDatastore } from './interfaces';
import { ExpressHttpAdapter } from './adapters';
import { ElasticSearchLearningObjectDatastore } from './drivers';
import { UserGateway } from './interfaces/UserGateway';
import { UserServiceGateway } from './gateways/UserServiceGateway';
import { UserLearningObjectDatastore } from './interfaces/UserLearningObjectDatastore';
import { MongoDBLearningObjectDatastore } from './drivers/UserLearningObjectDatastore/MongoDB/MongoDBLearningObjectDatastore/MongoDBLearningObjectDatastore';

@expressServiceModule({
  expressRouter: ExpressHttpAdapter.buildRouter(),
  providers: [
    {
      provide: LearningObjectDatastore,
      useClass: ElasticSearchLearningObjectDatastore,
    },
    {
      provide: UserGateway,
      useClass: UserServiceGateway,
    },
    {
      provide: UserLearningObjectDatastore,
      useClass: MongoDBLearningObjectDatastore,
    },
  ],
})
export class LearningObjectSearch extends ExpressServiceModule {}
