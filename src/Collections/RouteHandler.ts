import {Request, Response, Router} from 'express';
import * as CollectionInteractor from './CollectionInteractor';
import {CollectionDataStore} from './CollectionDataStore';
import { mapErrorToResponseData } from '../errors';

export function initializeCollectionRouter({ router, dataStore }: { router: Router, dataStore: CollectionDataStore}) {
  /**
   * Gets the metadata for all collections
   */
  const getAllCollections = async (req: Request, res: Response) => {
    try {
      const collections = await CollectionInteractor.fetchCollections(
        dataStore,
      );
      res.status(200).send(collections);
    } catch (e) {
      console.error(e);
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };
  /**
   * Return a full collection {name: string, abstracts: [], learningObjects: []}
   */
  const getCollection = async (req: Request, res: Response) => {
    try {
      const name = req.params.name;
      const collection = await CollectionInteractor.fetchCollection(
        dataStore,
        name,
      );
      res.status(200).send(collection);
    } catch (e) {
      console.error(e);
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };
  /**
   * Return the name of a collection and a list of it's abstracts
   */
  const getCollectionMetadata = async (req: Request, res: Response) => {
    try {
      const collectionMeta = await CollectionInteractor.fetchCollectionMeta(
        dataStore,
        req.params.name,
      );
      res.status(200).send(collectionMeta);
    } catch (e) {
      console.error(e);
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  router.get('/collections', getAllCollections);
  router.get('/collections/:name', getCollection);
  router.get('/collections/:name/meta', getCollectionMetadata);
}
