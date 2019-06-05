import { initialize } from './SubmissionRouteDriver';
import { Router } from 'express-serve-static-core';
import { FileManager } from '../shared/interfaces/interfaces';
import { MongoSubmissionDatastore } from './MongoSubmissionDatastore';

function wrap({ router, fileManager }: {
  router: Router;
  fileManager: FileManager;
}) {
  const dataStore = new MongoSubmissionDatastore();
  return initialize({
    dataStore,
    router,
    fileManager,
  });
}

export { wrap as initialize };
