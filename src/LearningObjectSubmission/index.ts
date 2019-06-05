import { initialize } from './SubmissionRouteDriver';
import { Router } from 'express-serve-static-core';
import { MongoSubmissionDatastore } from './MongoSubmissionDatastore';

function wrap({ router }: {
  router: Router;
}) {
  const dataStore = new MongoSubmissionDatastore();
  return initialize({
    dataStore,
    router,
  });
}

export { wrap as initialize };
