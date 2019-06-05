import { initialize } from './SubmissionRouteDriver';
import { Router } from 'express-serve-static-core';
import { MongoSubmissionDatastore } from './MongoSubmissionDatastore';
import { ElasticsearchSubmissionPublisher } from './ElasticsearchSubmissionPublisher';

function wrap({ router }: {
  router: Router;
}) {
  const dataStore = new MongoSubmissionDatastore();
  const publisher = new ElasticsearchSubmissionPublisher();
  return initialize({
    dataStore,
    router,
    publisher,
  });
}

export { wrap as initialize };
