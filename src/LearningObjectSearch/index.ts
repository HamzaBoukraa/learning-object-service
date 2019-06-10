import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { LearningObjectDatastore } from './interfaces';
import { ExpressHttpAdapter } from './adapters';
import { ElasticSearchLearningObjectDatastore } from './drivers';

@expressServiceModule({
  expressRouter: ExpressHttpAdapter.buildRouter(),
  providers: [
    {
      provide: LearningObjectDatastore,
      useClass: ElasticSearchLearningObjectDatastore,
    },
  ],
})
export class LearningObjectSearch extends ExpressServiceModule {}
