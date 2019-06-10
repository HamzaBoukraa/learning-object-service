import { Request, Response, Router } from 'express';
import { mapErrorToResponseData, ResourceErrorReason } from '../shared/errors';
import { DataStore } from '../shared/interfaces/DataStore';
import { FileManager, LibraryCommunicator } from '../shared/interfaces/interfaces';
import { UserToken } from '../shared/types';
import * as LearningObjectInteractor from './LearningObjectInteractor';
import { LearningObject } from '../shared/entity';
import { FileMeta } from './typings';

/**
 * Initializes an express router with endpoints for public Retrieving
 * a Learning Object.
 */
export function initializePublic({
  router,
  dataStore,
}: {
  router: Router;
  dataStore: DataStore;
}) {
  /**
   * Retrieve a learning object by a specified ID
   * @param {Request} req
   * @param {Response} res
   */
  const getLearningObjectById = async (req: Request, res: Response) => {
    try {
      const id = req.params.learningObjectId;
      const learningObject = await LearningObjectInteractor.getLearningObjectById(
        dataStore,
        id,
      );
      res.status(200).send(learningObject.toPlainObject());
    } catch (e) {
      res.status(500).send(e);
    }
  };

  router.get('/learning-objects/:learningObjectId', getLearningObjectById);

  return router;
}

/**
 * Initializes an express router with endpoints for public Creating, Updating, and Deleting
 * a Learning Object.
 *
 * @export
 * @param {{
 *   dataStore: DataStore;
 *   fileManager: FileManager;
 *   library: LibraryCommunicator;
 * }} {
 *   dataStore,
 *   fileManager,
 *   library,
 * }
 * @returns
 */
export function initializePrivate({
  router,
  dataStore,
  fileManager,
  library,
}: {
  router: Router;
  dataStore: DataStore;
  fileManager: FileManager;
  library: LibraryCommunicator;
}) {
  const addLearningObject = async (req: Request, res: Response) => {
    let object: LearningObject;

    try {
      object = new LearningObject(req.body.object);
      const learningObject = await LearningObjectInteractor.addLearningObject(
        dataStore,
        object,
        req.user,
      );
      res.status(200).send(learningObject.toPlainObject());
    } catch (e) {

      let status = 500;

      // if the error was that the object has a duplicate name, send a 409 error code
      if (
        object &&
        object.name &&
        e.message ===
          `A learning object with name '${object.name}' already exists.`
      ) {
        status = 409;
      }

      res.status(status).send(e);
    }
  };
  const getMaterials = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const materials = await LearningObjectInteractor.getMaterials({
        dataStore,
        id,
      });
      res.status(200).send(materials);
    } catch (e) {
      res.status(500).send(e);
    }
  };
  const updateLearningObject = async (req: Request, res: Response) => {
    let updates: any;

    try {
      const id: string = req.params.id;
      updates = req.body.learningObject;
      const userToken: UserToken = req.user;
      await LearningObjectInteractor.updateLearningObject({
        userToken,
        dataStore,
        id,
        updates,
      });
      res.sendStatus(200);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };
  const deleteLearningObject = async (req: Request, res: Response) => {
    try {
      const user: UserToken = req.user;
      const learningObjectName = req.params.learningObjectName;
      await LearningObjectInteractor.deleteLearningObject({
        dataStore,
        fileManager,
        learningObjectName,
        library,
        user,
      });
      res.sendStatus(200);
    } catch (e) {

      let status = 500;

      if (e.name === ResourceErrorReason.INVALID_ACCESS) {
        status = 401;
      }
      res.status(status).send(e);
    }
  };

  const getLearningObjectChildren = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const children = await LearningObjectInteractor.getLearningObjectChildrenById(
        dataStore,
        id,
      );
      res.status(200).json(children.map(c => c.toPlainObject()));
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  const addFileMeta = async (req: Request, res: Response) => {
    try {
      const requester: UserToken = req.user;
      const authorUsername: string = req.params.username;
      const learningObjectId: string = req.params.learningObjectId;
      const fileMeta: FileMeta | FileMeta[] = req.body.fileMeta;
      let fileMetaId;
      if (Array.isArray(fileMeta)) {
        fileMetaId = await LearningObjectInteractor.addLearningObjectFiles({
          dataStore,
          requester,
          authorUsername,
          learningObjectId,
          fileMeta,
        });
      } else {
        fileMetaId = await LearningObjectInteractor.addLearningObjectFile({
          dataStore,
          requester,
          authorUsername,
          learningObjectId,
          fileMeta,
        });
      }
      res.status(200).send({ fileMetaId });
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({ message });
    }
  };

  router.route('/learning-objects').post(addLearningObject);
  router.patch('/learning-objects/:id', updateLearningObject);
  router.delete('/learning-objects/:learningObjectName', deleteLearningObject);
  router.get('/learning-objects/:id/materials/all', getMaterials);
  router.get(
    '/learning-objects/:id/children/summary',
    getLearningObjectChildren,
  );
  router.post(
    '/users/:username/learning-objects/:learningObjectId/materials/files',
    addFileMeta,
  );
}
