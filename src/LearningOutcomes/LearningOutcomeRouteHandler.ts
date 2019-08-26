import * as LearningOutcomeInteractor from './LearningOutcomeInteractor';
import { Request, Response, Router } from 'express';
import { LearningOutcomeUpdate } from './types';
import { UserToken } from '../shared/types';
import { mapErrorToResponseData } from '../shared/errors';
import { ModuleLearningObjectGateway, LearningObjectGateway } from './gateways/ModuleLearningObjectGateway';
import { LearningOutcomeDatastore } from './datastores/LearningOutcomeDataStore';

/**
 * Returns a new instance of ModuleLearningObjectGateway
 *
 * @returns { LearningObjectGateway }
 */
function getLearningObjectGateway(): LearningObjectGateway {
  return new ModuleLearningObjectGateway();
}

export function initializePublic({
  router,
  dataStore,
}: {
  router: Router,
  dataStore: LearningOutcomeDatastore,
}) {
  const getLearningObjectsOutcomes = async (req: Request, res: Response) => {
    try {
      const source = req.params.id;
      const requester = req.user;

      const outcomes = await LearningOutcomeInteractor.getAllLearningOutcomes({ dataStore, requester, source, learningObjectGateway: getLearningObjectGateway() });
      res.status(200).json(outcomes);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  router.get('/users/:username/learning-objects/:id/outcomes', getLearningObjectsOutcomes);
}

/**
 * Initializes an express router with authenticated endpoints to Create, Update, and Delete
 * a Learning Outcome.
 */
export function initializePrivate({
  router,
  dataStore,
}: {
  router: Router;
  dataStore: LearningOutcomeDatastore;
}) {
  const addLearningOutcome = async (req: Request, res: Response) => {
    try {
      const user: UserToken = req.user;
      const outcomeInput = req.body.outcome;
      const source: string = req.params.id;
      const id = await LearningOutcomeInteractor.addLearningOutcome({
        dataStore,
        user,
        source,
        outcomeInput,
      });
      res.status(200).send(id);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  const getLearningOutcome = async (req: Request, res: Response) => {
    try {
      const user: UserToken = req.user;
      const id: string = req.params.outcomeId;
      const learningOutcome = await LearningOutcomeInteractor.getLearningOutcome(
        {
          dataStore,
          id,
          user,
        },
      );
      res.status(200).send(learningOutcome.toPlainObject());
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  const updateLearningOutcome = async (req: Request, res: Response) => {
    try {
      const user: UserToken = req.user;
      const id: string = req.params.outcomeId;
      const updates: LearningOutcomeUpdate = req.body.outcome;
      const outcome = await LearningOutcomeInteractor.updateLearningOutcome({
        user,
        dataStore,
        id,
        updates,
      });
      res.status(200).send(outcome.toPlainObject());
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  const deleteLearningOutcome = async (req: Request, res: Response) => {
    try {
      const user: UserToken = req.user;
      const id = req.params.outcomeId;
      await LearningOutcomeInteractor.deleteLearningOutcome({
        dataStore,
        user,
        id,
      });
      res.sendStatus(204);
    } catch (e) {
      const { code, message } = mapErrorToResponseData(e);
      res.status(code).json({message});
    }
  };

  router
    .route('/learning-objects/:id/learning-outcomes')
    .post(addLearningOutcome);

  router
    .route('/learning-objects/:id/learning-outcomes/:outcomeId')
    .get(getLearningOutcome)
    .patch(updateLearningOutcome)
    .delete(deleteLearningOutcome);
}
