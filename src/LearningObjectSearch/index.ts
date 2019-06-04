import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { LearningObjectSearchGateway } from './interfaces';
import { ExpressHttpAdapter } from './adapters';

@expressServiceModule({
  expressRouter: ExpressHttpAdapter.buildRouter(),
  providers: [
    { provide: LearningObjectSearchGateway, useClass: null },
  ],
})
export class LearningObjectSearch extends ExpressServiceModule {}
