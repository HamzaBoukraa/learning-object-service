import {
  ExpressServiceModule,
  expressServiceModule,
} from 'node-service-module';
import { LearningObjectDatastore } from './interfaces';
import { ExpressHttpAdapter } from './adapters';

@expressServiceModule({
  expressRouter: ExpressHttpAdapter.buildRouter(),
  providers: [
    /**
     * *** NOTE ***
     * `useClass` is `null` now because this PR just handled refactoring of biz-logic into a module, so no driver implementation is available to provide.
     * Once the Elastic Search Driver/Gateway is implemented, that will be the class that is provided.
     */
    { provide: LearningObjectDatastore, useClass: null },
  ],
})
export class LearningObjectSearch extends ExpressServiceModule {}
