import * as LearningOutcomeInteractor from './LearningOutcomeInteractor';
import { Request, Response, Router } from 'express';
import { LearningOutcomeUpdate } from './types';
import { UserToken } from '../shared/types';
import { mapErrorToResponseData } from '../shared/errors';

/**
 * Initializes an express router with endpoints to Create, Update, and Delete
 * a Learning Outcome.
 */
export function initialize({
  router,
  dataStore,
}: {
  router: Router;
  dataStore: LearningOutcomeInteractor.LearningOutcomeDatastore;
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
